"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyRole } from "@/lib/notify";

/** Laboran's sign-off, universal for every jenisKeperluan. Praktikum goes straight to
 *  READY_FOR_PICKUP from here; Riset/Kegiatan Lainnya continue on to Kepala Lab. */
export async function approveLaboran(loanId: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { approvals: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "WAITING_LABORAN_APPROVAL") throw new Error("Peminjaman ini sudah diproses oleh pihak lain.");

  const approval = loan.approvals.find((a) => a.level === "LABORAN" && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap approval ini tidak ditemukan atau sudah diproses.");

  const needsKepalaLab = loan.jenisKeperluan !== "PRAKTIKUM";
  const nextStatus = needsKepalaLab ? "WAITING_HEAD_APPROVAL" : "READY_FOR_PICKUP";

  const kepalaLabNotifications = needsKepalaLab
    ? await notifyRole("KEPALA_LAB", {
        type: "APPROVAL_BARU",
        title: "Menunggu persetujuan Anda",
        message: `Peminjaman ${loan.nomorPeminjaman} sudah disetujui Laboran, menunggu persetujuan Anda.`,
      })
    : [];

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "DISETUJUI", byId: profile.id, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: nextStatus } }),
    ...(needsKepalaLab ? [prisma.approval.create({ data: { loanId, level: "KEPALA_LAB", status: "MENUNGGU" as const } })] : []),
    prisma.activityLog.create({
      data: { type: "APPROVAL", actorId: profile.id, message: `Peminjaman ${loan.nomorPeminjaman} disetujui oleh Laboran.` },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Disetujui Laboran",
        message: needsKepalaLab
          ? `Peminjaman ${loan.nomorPeminjaman} disetujui Laboran, menunggu persetujuan Kepala Lab.`
          : `Peminjaman ${loan.nomorPeminjaman} disetujui. Alat siap diambil.`,
      },
    }),
    ...kepalaLabNotifications,
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}

export async function rejectLaboran(loanId: string, catatan: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { approvals: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "WAITING_LABORAN_APPROVAL") throw new Error("Peminjaman ini sudah diproses oleh pihak lain.");

  const approval = loan.approvals.find((a) => a.level === "LABORAN" && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap approval ini tidak ditemukan atau sudah diproses.");

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "DITOLAK", byId: profile.id, catatan, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: "LABORAN_REJECTED" } }),
    prisma.activityLog.create({
      data: { type: "APPROVAL", actorId: profile.id, message: `Peminjaman ${loan.nomorPeminjaman} ditolak oleh Laboran.` },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Peminjaman ditolak",
        message: `Peminjaman ${loan.nomorPeminjaman} ditolak oleh Laboran. Catatan: ${catatan}`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}

/** Second stage, Riset/Kegiatan Lainnya only. */
export async function approveKepalaLab(loanId: string) {
  const profile = await requireRole("KEPALA_LAB");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { approvals: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "WAITING_HEAD_APPROVAL") throw new Error("Peminjaman ini sudah diproses oleh pihak lain.");

  const approval = loan.approvals.find((a) => a.level === "KEPALA_LAB" && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap approval ini tidak ditemukan atau sudah diproses.");

  const laboranNotifications = await notifyRole("LABORAN", {
    type: "APPROVAL_BARU",
    title: "Alat siap diserahkan",
    message: `Peminjaman ${loan.nomorPeminjaman} sudah disetujui Kepala Lab. Siapkan barang untuk diserahkan.`,
  });

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "DISETUJUI", byId: profile.id, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: "READY_FOR_PICKUP" } }),
    prisma.activityLog.create({
      data: { type: "APPROVAL", actorId: profile.id, message: `Peminjaman ${loan.nomorPeminjaman} disetujui oleh Kepala Lab.` },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Disetujui Kepala Lab",
        message: `Peminjaman ${loan.nomorPeminjaman} disetujui Kepala Lab. Alat siap diambil.`,
      },
    }),
    ...laboranNotifications,
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}

export async function rejectKepalaLab(loanId: string, catatan: string) {
  const profile = await requireRole("KEPALA_LAB");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { approvals: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "WAITING_HEAD_APPROVAL") throw new Error("Peminjaman ini sudah diproses oleh pihak lain.");

  const approval = loan.approvals.find((a) => a.level === "KEPALA_LAB" && a.status === "MENUNGGU");
  if (!approval) throw new Error("Tahap approval ini tidak ditemukan atau sudah diproses.");

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "DITOLAK", byId: profile.id, catatan, decidedAt: new Date() },
    }),
    prisma.loan.update({ where: { id: loanId }, data: { status: "HEAD_REJECTED" } }),
    prisma.activityLog.create({
      data: { type: "APPROVAL", actorId: profile.id, message: `Peminjaman ${loan.nomorPeminjaman} ditolak oleh Kepala Lab.` },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Peminjaman ditolak",
        message: `Peminjaman ${loan.nomorPeminjaman} ditolak oleh Kepala Lab. Catatan: ${catatan}`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}
