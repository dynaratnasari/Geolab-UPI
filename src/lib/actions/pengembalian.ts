"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function prosesPengembalian(loanId: string, kondisiCheck: "BAIK" | "RUSAK", catatan?: string) {
  const profile = await requireRole("LABORAN");

  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { items: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "DIAMBIL") throw new Error("Peminjaman ini tidak sedang dipinjam.");

  await prisma.$transaction([
    prisma.returnRecord.create({ data: { loanId, kondisiCheck, catatan } }),
    prisma.loan.update({ where: { id: loanId }, data: { status: "DIKEMBALIKAN" } }),
    ...loan.items.flatMap((li) => [
      prisma.inventoryItem.update({
        where: { id: li.itemId },
        data: {
          jumlahDipinjam: { decrement: li.jumlah },
          ...(kondisiCheck === "BAIK"
            ? { jumlahTersedia: { increment: li.jumlah } }
            : { jumlahRusak: { increment: li.jumlah } }),
        },
      }),
      ...(li.unitId
        ? [
            prisma.inventoryUnit.update({
              where: { id: li.unitId },
              data: {
                status: kondisiCheck === "BAIK" ? ("TERSEDIA" as const) : ("RUSAK" as const),
                kondisi: kondisiCheck === "BAIK" ? ("BERFUNGSI" as const) : ("RUSAK" as const),
              },
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
        message: `Barang untuk peminjaman ${loan.nomorPeminjaman} dikembalikan (${kondisiCheck}).`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/inventaris");
  revalidatePath("/dashboard");
}
