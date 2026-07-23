import "server-only";
import { prisma } from "@/lib/prisma";

export async function getLoanStatusBreakdown() {
  const rows = await prisma.loan.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, jumlah: r._count._all }));
}

export async function getLoansPerMonth(months = 6) {
  const loans = await prisma.loan.findMany({ select: { createdAt: true } });
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(d);
    buckets.set(key, 0);
  }
  for (const loan of loans) {
    const key = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(loan.createdAt);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
  }
  return Array.from(buckets.entries()).map(([bulan, jumlah]) => ({ bulan, jumlah }));
}

export async function getTopBorrowedItems(limit = 5) {
  const grouped = await prisma.loanItem.groupBy({ by: ["itemId"], _sum: { jumlah: true }, orderBy: { _sum: { jumlah: "desc" } }, take: limit });
  const items = await prisma.inventoryItem.findMany({ where: { id: { in: grouped.map((g) => g.itemId) } } });
  const itemMap = new Map(items.map((i) => [i.id, i]));
  return grouped.map((g) => ({ nama: itemMap.get(g.itemId)?.nama ?? "—", jumlah: g._sum.jumlah ?? 0 }));
}

export async function getPeminjamanPerProdi() {
  const loans = await prisma.loan.findMany({ select: { prodi: true } });
  const counts = new Map<string, number>();
  for (const l of loans) {
    const key = l.prodi ?? "Tidak diketahui";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([prodi, jumlah]) => ({ prodi, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

export async function getStatistikSummary() {
  const [totalLoans, bulanIni, ditolak, dikembalikan] = await Promise.all([
    prisma.loan.count(),
    prisma.loan.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.loan.count({ where: { status: "DITOLAK" } }),
    prisma.loan.count({ where: { status: "DIKEMBALIKAN" } }),
  ]);
  return { totalLoans, bulanIni, ditolak, dikembalikan };
}
