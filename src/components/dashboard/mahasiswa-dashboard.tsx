import Link from "next/link";
import { Plus, BookMarked, CalendarClock, Undo2, AlarmClockOff } from "lucide-react";
import { getJadwalBerikutnya } from "@/lib/queries/dashboard";
import { getMahasiswaActiveLoans, getMahasiswaRiwayatCount } from "@/lib/queries/dashboard-mahasiswa";
import { JadwalList } from "@/components/dashboard/jadwal-list";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@prisma/client";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export async function MahasiswaDashboard({ profile }: { profile: Profile }) {
  const [activeLoans, riwayatCount, jadwalBerikutnya] = await Promise.all([
    getMahasiswaActiveLoans(profile.id),
    getMahasiswaRiwayatCount(profile.id),
    getJadwalBerikutnya(3),
  ]);

  const overdueLoans = activeLoans.filter((l) => l.status === "OVERDUE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {profile.name} — Mahasiswa</p>
      </div>

      {overdueLoans.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-soft">
          <AlarmClockOff className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {overdueLoans.length === 1
                ? "Anda memiliki 1 peminjaman yang terlambat dikembalikan"
                : `Anda memiliki ${overdueLoans.length} peminjaman yang terlambat dikembalikan`}
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Segera kembalikan ke Laboran:{" "}
              {overdueLoans.map((l, i) => (
                <span key={l.id}>
                  <Link href={`/peminjaman/${l.id}`} className="font-mono underline">
                    {l.nomorPeminjaman}
                  </Link>
                  {i < overdueLoans.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

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
                    {loan.status === "OVERDUE" && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlarmClockOff className="h-3.5 w-3.5" />
                        Sudah melewati batas waktu pengembalian ({formatTanggal(loan.tanggalKembali)}). Segera kembalikan ke
                        Laboran.
                      </p>
                    )}
                    {loan.status === "BORROWED" && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Undo2 className="h-3.5 w-3.5" />
                        Kembalikan ke Laboran paling lambat {formatTanggal(loan.tanggalKembali)}.
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
