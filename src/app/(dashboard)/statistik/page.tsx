import { BookMarked, CalendarClock, XCircle, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoansPerMonthChart, TopItemsChart, ProdiChart } from "@/components/statistik/statistik-charts";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import {
  getStatistikSummary,
  getLoansPerMonth,
  getTopBorrowedItems,
  getPeminjamanPerProdi,
  getLoanStatusBreakdown,
} from "@/lib/queries/statistik";

export default async function StatistikPage() {
  await requireRole("KEPALA_LAB");

  const [summary, perBulan, topItems, perProdi, statusBreakdown] = await Promise.all([
    getStatistikSummary(),
    getLoansPerMonth(),
    getTopBorrowedItems(),
    getPeminjamanPerProdi(),
    getLoanStatusBreakdown(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistik</h1>
        <p className="text-sm text-muted-foreground">Statistik peminjaman dan pemakaian alat laboratorium.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Peminjaman" value={summary.totalLoans} icon={BookMarked} tone="default" />
        <StatCard label="Peminjaman Bulan Ini" value={summary.bulanIni} icon={CalendarClock} tone="info" />
        <StatCard label="Selesai Dikembalikan" value={summary.dikembalikan} icon={CheckCircle2} tone="success" />
        <StatCard label="Ditolak" value={summary.ditolak} icon={XCircle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Peminjaman per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <LoansPerMonthChart data={perBulan} />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Barang Paling Sering Dipinjam</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data peminjaman.</p>
            ) : (
              <TopItemsChart data={topItems} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Peminjaman per Program Studi</CardTitle>
          </CardHeader>
          <CardContent>
            {perProdi.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data peminjaman.</p>
            ) : (
              <ProdiChart data={perProdi} />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status Peminjaman</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data peminjaman.</p>
            ) : (
              <ul className="space-y-3">
                {statusBreakdown.map((s) => (
                  <li key={s.status} className="flex items-center justify-between">
                    <LoanStatusBadge status={s.status} />
                    <span className="text-sm font-semibold text-foreground">{s.jumlah}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
