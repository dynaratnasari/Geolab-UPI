import "server-only";
import { prisma } from "@/lib/prisma";
import { HARI_INDONESIA } from "@/lib/constants/hari";

export async function getInventoryStats() {
  const agg = await prisma.inventoryItem.aggregate({
    _sum: {
      jumlahTotal: true,
      jumlahTersedia: true,
      jumlahDipinjam: true,
      jumlahMaintenance: true,
      jumlahRusak: true,
      jumlahHilang: true,
    },
  });
  return {
    total: agg._sum.jumlahTotal ?? 0,
    tersedia: agg._sum.jumlahTersedia ?? 0,
    dipinjam: agg._sum.jumlahDipinjam ?? 0,
    maintenance: agg._sum.jumlahMaintenance ?? 0,
    rusak: agg._sum.jumlahRusak ?? 0,
    hilang: agg._sum.jumlahHilang ?? 0,
  };
}

export async function getKondisiBreakdown() {
  const rows = await prisma.inventoryItem.groupBy({
    by: ["kondisi"],
    _sum: { jumlahTotal: true },
  });
  return rows.map((r) => ({ kondisi: r.kondisi, jumlah: r._sum.jumlahTotal ?? 0 }));
}

export async function getKategoriBreakdown() {
  const categories = await prisma.category.findMany({
    include: { items: { select: { jumlahTotal: true } } },
    orderBy: { nama: "asc" },
  });
  return categories
    .map((c) => ({ nama: c.nama, jumlah: c.items.reduce((sum, i) => sum + i.jumlahTotal, 0) }))
    .filter((c) => c.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);
}

export async function getPengadaanPerTahun() {
  const items = await prisma.inventoryItem.findMany({
    where: { tanggalPembelian: { not: null } },
    select: { tanggalPembelian: true, jumlahTotal: true },
  });
  const byYear = new Map<number, number>();
  for (const item of items) {
    const year = item.tanggalPembelian!.getFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + item.jumlahTotal);
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([tahun, jumlah]) => ({ tahun: String(tahun), jumlah }));
}

export async function getJadwalHariIni() {
  const hariIni = HARI_INDONESIA[new Date().getDay()];
  return prisma.schedule.findMany({
    where: { hari: hariIni },
    include: { course: true, dosen: true },
    orderBy: { jamMulai: "asc" },
  });
}

export async function getJadwalBerikutnya(limit = 5) {
  const todayIndex = new Date().getDay(); // 0 = Minggu
  const jamSekarang = new Date().toTimeString().slice(0, 5).replace(":", ".");

  const all = await prisma.schedule.findMany({ include: { course: true, dosen: true } });

  // Chronological distance from "now" within the week (0 = later today, 1 = tomorrow, ... 6 = in 6 days;
  // 7 = today but already started, pushed to next week).
  return all
    .map((s) => {
      const dayIndex = HARI_INDONESIA.indexOf(s.hari);
      let delta = dayIndex === -1 ? 7 : (dayIndex - todayIndex + 7) % 7;
      if (delta === 0 && s.jamMulai <= jamSekarang) delta = 7;
      return { schedule: s, delta };
    })
    .sort((a, b) => a.delta - b.delta || a.schedule.jamMulai.localeCompare(b.schedule.jamMulai))
    .slice(0, limit)
    .map((x) => x.schedule);
}

export async function getPendingApprovalCount() {
  return prisma.approval.count({ where: { status: "MENUNGGU" } });
}

export async function getRecentActivity(limit = 8) {
  return prisma.activityLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
