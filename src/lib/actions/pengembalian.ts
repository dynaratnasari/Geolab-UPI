"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { KondisiPengembalian } from "@prisma/client";

const GOOD_CONDITIONS: KondisiPengembalian[] = ["SANGAT_BAIK", "BAIK"];
const DAMAGED_CONDITIONS: KondisiPengembalian[] = ["KURANG_BAIK", "RUSAK_RINGAN", "RUSAK_BERAT"];

/** Laboran scans the return QR — marks that the physical handback happened, before the
 *  inspection form (which needs kondisi/foto/catatan) is filled in. */
export async function confirmReturnScan(loanId: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "BORROWED" && loan.status !== "OVERDUE") throw new Error("Peminjaman ini tidak sedang dipinjam.");

  await prisma.$transaction([
    prisma.loan.update({ where: { id: loanId }, data: { status: "RETURN_PENDING_INSPECTION" } }),
    prisma.activityLog.create({
      data: {
        type: "BARANG_KEMBALI",
        actorId: profile.id,
        message: `Barang untuk peminjaman ${loan.nomorPeminjaman} discan untuk pengembalian, menunggu pemeriksaan.`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
}

/** Inspection form submit — the only place a return is finalized. Accepts loans still in
 *  BORROWED/OVERDUE too (not every return goes through the dedicated scan page first), so
 *  Laboran can complete it directly from the approval list. */
export async function submitInspection(loanId: string, kondisi: KondisiPengembalian, catatan?: string, fotoUrl?: string) {
  const profile = await requireRole("LABORAN");

  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { items: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (!["BORROWED", "OVERDUE", "RETURN_PENDING_INSPECTION"].includes(loan.status)) {
    throw new Error("Peminjaman ini tidak sedang menunggu pemeriksaan pengembalian.");
  }

  const nextStatus = GOOD_CONDITIONS.includes(kondisi)
    ? ("RETURNED" as const)
    : DAMAGED_CONDITIONS.includes(kondisi)
      ? ("RETURNED_DAMAGED" as const)
      : ("RETURNED_LOST" as const);

  const unitStatus = GOOD_CONDITIONS.includes(kondisi) ? "TERSEDIA" : kondisi === "HILANG" ? "HILANG" : "RUSAK";
  const unitKondisi = GOOD_CONDITIONS.includes(kondisi) ? "BERFUNGSI" : kondisi === "HILANG" ? "HILANG" : "RUSAK";

  await prisma.$transaction([
    prisma.returnRecord.create({ data: { loanId, kondisi, catatan, fotoUrl } }),
    prisma.loan.update({ where: { id: loanId }, data: { status: nextStatus } }),
    ...loan.items.flatMap((li) => [
      prisma.inventoryItem.update({
        where: { id: li.itemId },
        data: {
          jumlahDipinjam: { decrement: li.jumlah },
          ...(nextStatus === "RETURNED"
            ? { jumlahTersedia: { increment: li.jumlah } }
            : nextStatus === "RETURNED_LOST"
              ? { jumlahHilang: { increment: li.jumlah } }
              : { jumlahRusak: { increment: li.jumlah } }),
        },
      }),
      ...(li.unitId
        ? [
            prisma.inventoryUnit.update({
              where: { id: li.unitId },
              data: { status: unitStatus as "TERSEDIA" | "RUSAK" | "HILANG", kondisi: unitKondisi as "BERFUNGSI" | "RUSAK" | "HILANG" },
            }),
          ]
        : []),
      prisma.transaction.create({
        data: { type: "MASUK", itemId: li.itemId, jumlah: li.jumlah, operatorId: profile.id, mahasiswaId: loan.mahasiswaId },
      }),
    ]),
    prisma.activityLog.create({
      data: {
        type: "BARANG_KEMBALI",
        actorId: profile.id,
        message: `Barang untuk peminjaman ${loan.nomorPeminjaman} dikembalikan (${kondisi}).`,
      },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "BARANG_KEMBALI",
        title: "Pengembalian diproses",
        message: `Peminjaman ${loan.nomorPeminjaman} sudah diperiksa dan dinyatakan selesai.`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/inventaris");
  revalidatePath("/dashboard");
}
