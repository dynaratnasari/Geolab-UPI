"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeUnitCounts } from "@/lib/inventory-counts";

/** Laboran confirms physical pickup — reached either by scanning the mahasiswa's kupon QR or
 *  by clicking through the approval list. This is the only place READY_FOR_PICKUP -> BORROWED
 *  happens, and it's the point where inventory actually leaves the shelf. */
export async function confirmPickup(loanId: string) {
  const profile = await requireRole("LABORAN");
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { items: true } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.status !== "READY_FOR_PICKUP") throw new Error("Peminjaman ini belum siap diambil.");

  await prisma.$transaction(async (tx) => {
    // The specific unit was only checked for availability back when the request was first
    // submitted — approval can take long enough for another loan to have picked it up in the
    // meantime, so re-check right here instead of trusting the original selection.
    for (const li of loan.items) {
      if (!li.unitId) continue;
      const unit = await tx.inventoryUnit.findUnique({ where: { id: li.unitId } });
      if (!unit || unit.status !== "TERSEDIA") {
        throw new Error(
          `Unit ${unit?.kodeUnit ?? ""} untuk ${loan.nomorPeminjaman} sudah tidak tersedia (kemungkinan sudah dipinjam pihak lain). Tidak bisa diserahkan.`,
        );
      }
    }

    await tx.loan.update({ where: { id: loanId }, data: { status: "BORROWED" } });

    const unitTrackedItemIds = new Set<string>();
    for (const li of loan.items) {
      if (li.unitId) {
        await tx.inventoryUnit.update({ where: { id: li.unitId }, data: { status: "DIPINJAM" } });
        unitTrackedItemIds.add(li.itemId);
      } else {
        await tx.inventoryItem.update({
          where: { id: li.itemId },
          data: { jumlahTersedia: { decrement: li.jumlah }, jumlahDipinjam: { increment: li.jumlah } },
        });
      }
      await tx.transaction.create({
        data: { type: "KELUAR", itemId: li.itemId, jumlah: li.jumlah, operatorId: profile.id, mahasiswaId: loan.mahasiswaId },
      });
    }
    for (const itemId of unitTrackedItemIds) {
      await recomputeUnitCounts(tx, itemId);
    }

    await tx.activityLog.create({
      data: {
        type: "BARANG_DIPINJAM",
        actorId: profile.id,
        role: profile.role,
        loanId,
        statusLama: "READY_FOR_PICKUP",
        statusBaru: "BORROWED",
        message: `Barang untuk peminjaman ${loan.nomorPeminjaman} diserahkan.`,
      },
    });
    await tx.notification.create({
      data: {
        profileId: loan.mahasiswaId,
        type: "APPROVAL_BARU",
        title: "Barang sudah diambil",
        message: `Peminjaman ${loan.nomorPeminjaman} sedang dipinjam. Kembalikan sebelum jatuh tempo.`,
      },
    });
  });

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/inventaris");
  revalidatePath("/dashboard");
}
