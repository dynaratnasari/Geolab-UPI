"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Laboran confirms physical pickup — reached either by scanning the mahasiswa's kupon QR or
 *  by clicking through the approval list. This is the only place READY_FOR_PICKUP -> BORROWED
 *  happens, and it's the point where inventory actually leaves the shelf. */
export async function confirmPickup(loanId: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { items: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "READY_FOR_PICKUP") throw new Error("Peminjaman ini belum siap diambil.");

  await prisma.$transaction([
    prisma.loan.update({ where: { id: loanId }, data: { status: "BORROWED" } }),
    ...loan.items.flatMap((li) => [
      prisma.inventoryItem.update({
        where: { id: li.itemId },
        data: { jumlahTersedia: { decrement: li.jumlah }, jumlahDipinjam: { increment: li.jumlah } },
      }),
      ...(li.unitId ? [prisma.inventoryUnit.update({ where: { id: li.unitId }, data: { status: "DIPINJAM" as const } })] : []),
      prisma.transaction.create({
        data: { type: "KELUAR", itemId: li.itemId, jumlah: li.jumlah, operatorId: profile.id, mahasiswaId: loan.mahasiswaId },
      }),
    ]),
    prisma.activityLog.create({
      data: { type: "BARANG_DIPINJAM", actorId: profile.id, message: `Barang untuk peminjaman ${loan.nomorPeminjaman} diserahkan.` },
    }),
    prisma.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Barang sudah diambil",
        message: `Peminjaman ${loan.nomorPeminjaman} sedang dipinjam. Kembalikan sebelum jatuh tempo.`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/inventaris");
  revalidatePath("/dashboard");
}
