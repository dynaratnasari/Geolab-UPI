import "server-only";
import type { Prisma, UnitStatus } from "@prisma/client";

/** For Tipe 2/3 items (individually tracked units), the parent's jumlah* fields must always
 *  match a straight count of its units' current status — recomputed from the units table
 *  itself, not accumulated via manual increment/decrement math on the parent row. The latter
 *  drifts permanently whenever the same physical unit cycles through more than one loan (a
 *  return that improves a unit's condition has nothing to "undo" the earlier increment that
 *  its previous, worse condition added to jumlahRusak/jumlahMaintenance/jumlahHilang). */
export async function recomputeUnitCounts(tx: Prisma.TransactionClient, itemId: string) {
  const units = await tx.inventoryUnit.findMany({ where: { itemId }, select: { status: true } });
  const counts: Record<UnitStatus, number> = { TERSEDIA: 0, DIPINJAM: 0, MAINTENANCE: 0, RUSAK: 0, HILANG: 0 };
  for (const u of units) counts[u.status]++;

  await tx.inventoryItem.update({
    where: { id: itemId },
    data: {
      jumlahTersedia: counts.TERSEDIA,
      jumlahDipinjam: counts.DIPINJAM,
      jumlahMaintenance: counts.MAINTENANCE,
      jumlahRusak: counts.RUSAK,
      jumlahHilang: counts.HILANG,
    },
  });
}
