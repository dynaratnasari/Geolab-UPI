import "server-only";
import { prisma } from "@/lib/prisma";

export async function getLocationsWithStats() {
  const locations = await prisma.location.findMany({
    include: {
      items: { select: { jumlahTotal: true, jumlahTersedia: true, kondisi: true } },
    },
    orderBy: [{ gedung: "asc" }, { ruangan: "asc" }],
  });

  const withStats = locations.map((loc) => ({
    id: loc.id,
    gedung: loc.gedung,
    ruangan: loc.ruangan,
    lemari: loc.lemari,
    rak: loc.rak,
    jenisBarang: loc.items.length,
    totalUnit: loc.items.reduce((s, i) => s + i.jumlahTotal, 0),
    tersediaUnit: loc.items.reduce((s, i) => s + i.jumlahTersedia, 0),
    bermasalah: loc.items.filter((i) => i.kondisi !== "BERFUNGSI").length,
  }));

  const byGedung = new Map<string, typeof withStats>();
  for (const loc of withStats) {
    const list = byGedung.get(loc.gedung) ?? [];
    list.push(loc);
    byGedung.set(loc.gedung, list);
  }

  return Array.from(byGedung.entries()).map(([gedung, ruangan]) => ({ gedung, ruangan }));
}

export async function getLocationDetail(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      items: { include: { category: true }, orderBy: { nama: "asc" } },
    },
  });
}
