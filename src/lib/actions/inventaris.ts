"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Kondisi, TipeAlat, UnitStatus } from "@prisma/client";

/** Changes an item's risk tier. Upgrading to TIPE_2/TIPE_3 backfills any missing per-unit codes. */
export async function updateTipeAlat(itemId: string, tipeAlat: TipeAlat) {
  await requireRole("KEPALA_LAB");

  const item = await prisma.inventoryItem.update({ where: { id: itemId }, data: { tipeAlat } });

  if (tipeAlat === "TIPE_1") {
    revalidatePath(`/inventaris/${itemId}`);
    revalidatePath("/inventaris");
    return;
  }

  const existing = await prisma.inventoryUnit.count({ where: { itemId } });
  if (existing >= item.jumlahTotal) {
    revalidatePath(`/inventaris/${itemId}`);
    revalidatePath("/inventaris");
    return;
  }

  const slots: { kondisi: Kondisi; status: UnitStatus }[] = [
    ...Array(item.jumlahTersedia).fill({ kondisi: "BERFUNGSI", status: "TERSEDIA" }),
    ...Array(item.jumlahDipinjam).fill({ kondisi: "BERFUNGSI", status: "DIPINJAM" }),
    ...Array(item.jumlahMaintenance).fill({ kondisi: "MAINTENANCE", status: "MAINTENANCE" }),
    ...Array(item.jumlahRusak).fill({ kondisi: "RUSAK", status: "RUSAK" }),
    ...Array(item.jumlahHilang).fill({ kondisi: "HILANG", status: "HILANG" }),
  ];
  while (slots.length < item.jumlahTotal) slots.push({ kondisi: "BERFUNGSI", status: "TERSEDIA" });

  const toCreate = slots.slice(existing).map((slot, i) => {
    const suffix = String(existing + i + 1).padStart(2, "0");
    return {
      itemId,
      kodeUnit: `${item.kodeInventaris}-${suffix}`,
      kodeQr: `QR-${item.kodeInventaris}-${suffix}`,
      kondisi: slot.kondisi,
      status: slot.status,
      locationId: item.locationId,
    };
  });
  if (toCreate.length > 0) {
    await prisma.inventoryUnit.createMany({ data: toCreate });
  }

  revalidatePath(`/inventaris/${itemId}`);
  revalidatePath("/inventaris");
}
