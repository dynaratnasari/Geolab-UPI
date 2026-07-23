import Link from "next/link";
import { Boxes, CheckCircle2, PackageCheck, Plus, BookMarked, CalendarClock, Undo2 } from "lucide-react";
import { getInventoryStats, getJadwalBerikutnya } from "@/lib/queries/dashboard";
import { getMahasiswaActiveLoans, getMahasiswaRiwayatCount } from "@/lib/queries/dashboard-mahasiswa";
import { StatCard } from "@/components/dashboard/stat-card";
import { JadwalList } from "@/components/dashboard/jadwal-list";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@prisma/client";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export async function MahasiswaDashboard({ profile }: { profile: Profile }) {
  const [stats, activeLoans, riwayatCount, jadwalBerikutnya] = await Promise.all([
    getInventoryStats(),
    getMahasiswaActiveLoans(profile.id),
    getMahasiswaRiwayatCount(profile.id),
    getJadwalBerikutnya(3),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {profile.name} — Mahasiswa</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Alat di Lab" value={stats.total} icon={Boxes} tone="default" />
        <StatCard label="Alat Tersedia" value={stats.tersedia} icon={CheckCircle2} tone="success" />
        <StatCard label="Sedang Dipinjam" value={stats.dipinjam} icon={PackageCheck} tone="info" />
      </div>

      <Link
        href="/peminjaman/ajukan"
        className="flex items-center justify-between gap-4 rounded-xl border border-upi-200 bg-upi-50 p-5 shadow-soft transition-colors hover:bg-upi-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-upi-700">
            <Plus className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-upi-800">Ajukan Peminjaman Baru</p>
            <p className="text-sm text-upi-700/80">Pinjam alat untuk praktikum atau penelitian Anda.</p>
          </div>
        </div>
      </Link>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Peminjaman Aktif Anda</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <BookMarked className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Anda belum memiliki peminjaman aktif.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeLoans.map((loan) => (
                <li key={loan.id}>
                  <Link
                    href={`/peminjaman/${loan.id}`}
                    className="block rounded-xl border border-border p-4 transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {loan.items.map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : i.item.nama)).join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTanggal(loan.tanggalPinjam)} – {formatTanggal(loan.tanggalKembali)}
                        </p>
                      </div>
                      <LoanStatusBadge status={loan.status} />
                    </div>
                    {(loan.status === "DIAMBIL" || loan.status === "TERLAMBAT") && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-orange-700">
                        <Undo2 className="h-3.5 w-3.5" />
                        Kembalikan ke Laboran paling lambat {formatTanggal(loan.tanggalKembali)}. Lihat detail untuk bukti
                        pengembalian.
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/peminjaman"
            className="mt-4 block text-center text-sm font-medium text-upi-700 hover:underline"
          >
            Lihat riwayat lengkap ({riwayatCount})
          </Link>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Jadwal Praktikum Berikutnya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JadwalList schedules={jadwalBerikutnya} emptyLabel="Tidak ada jadwal berikutnya." />
        </CardContent>
      </Card>
    </div>
  );
}
