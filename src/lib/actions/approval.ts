"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApprovalLevel, LoanStatus } from "@prisma/client";

async function decide(
  loanId: string,
  level: ApprovalLevel,
  expectedStatus: LoanStatus,
  decision: "DISETUJUI" | "DITOLAK",
  nextStatus: LoanStatus,
  catatan: string | undefined,
  byId: string,
  nextApprovalLevel?: ApprovalLevel,
) {
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { approvals: true, mahasiswa: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== expectedStatus) throw new Error("Peminjaman ini sudah diproses oleh pihak lain.");

  const approval = loan.approvals.find((a) => a.level === level && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap approval ini tidak ditemukan atau sudah diproses.");

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: decision, byId, catatan, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: nextStatus } }),
    ...(decision === "DISETUJUI" && nextApprovalLevel
      ? [prisma.approval.create({ data: { loanId, level: nextApprovalLevel, status: "MENUNGGU" as const } })]
      : []),
    prisma.activityLog.create({
      data: {
        type: "APPROVAL",
        actorId: byId,
        message:
          decision === "DISETUJUI"
            ? `Peminjaman ${loan.nomorPeminjaman} disetujui pada tahap ${level}.`
            : `Peminjaman ${loan.nomorPeminjaman} ditolak pada tahap ${level}.`,
      },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: decision === "DISETUJUI" ? "Peminjaman disetujui" : "Peminjaman ditolak",
        message: `Peminjaman ${loan.nomorPeminjaman} ${decision === "DISETUJUI" ? "disetujui" : "ditolak"} oleh ${level}.${
          catatan ? ` Catatan: ${catatan}` : ""
        }`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}

export async function approveDosen(loanId: string) {
  const profile = await requireRole("DOSEN");
  await decide(loanId, "DOSEN", "MENUNGGU_DOSEN", "DISETUJUI", "MENUNGGU_KEPALA_LAB", undefined, profile.id, "KEPALA_LAB");
}

export async function rejectDosen(loanId: string, catatan: string) {
  const profile = await requireRole("DOSEN");
  await decide(loanId, "DOSEN", "MENUNGGU_DOSEN", "DITOLAK", "DITOLAK", catatan, profile.id);
}

export async function approveKepalaLab(loanId: string) {
  const profile = await requireRole("KEPALA_LAB");
  await decide(loanId, "KEPALA_LAB", "MENUNGGU_KEPALA_LAB", "DISETUJUI", "DISETUJUI", undefined, profile.id, "LABORAN");
}

export async function rejectKepalaLab(loanId: string, catatan: string) {
  const profile = await requireRole("KEPALA_LAB");
  await decide(loanId, "KEPALA_LAB", "MENUNGGU_KEPALA_LAB", "DITOLAK", "DITOLAK", catatan, profile.id);
}

export async function serahTerima(loanId: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { approvals: true, items: true },
  });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "DISETUJUI") throw new Error("Peminjaman ini belum siap diserahkan.");

  const approval = loan.approvals.find((a) => a.level === "LABORAN" && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap serah terima tidak ditemukan.");

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "DISETUJUI", byId: profile.id, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: "DIAMBIL" } }),
    ...loan.items.flatMap((li) => [
      prisma.inventoryItem.update({
        where: { id: li.itemId },
        data: { jumlahTersedia: { decrement: li.jumlah }, jumlahDipinjam: { increment: li.jumlah } },
      }),
      prisma.transaction.create({
        data: { type: "KELUAR", itemId: li.itemId, jumlah: li.jumlah, operatorId: profile.id, mahasiswaId: loan.mahasiswaId },
      }),
    ]),
    prisma.activityLog.create({
      data: { type: "BARANG_DIPINJAM", actorId: profile.id, message: `Barang untuk peminjaman ${loan.nomorPeminjaman} diserahkan.` },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/inventaris");
  revalidatePath("/dashboard");
}
