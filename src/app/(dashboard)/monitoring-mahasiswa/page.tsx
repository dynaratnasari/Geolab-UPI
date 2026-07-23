import { GraduationCap, BookMarked, Clock, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getMonitoringMahasiswa } from "@/lib/queries/monitoring";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default async function MonitoringMahasiswaPage() {
  const profile = await requireRole("DOSEN");
  const { loans, summary, courseCount } = await getMonitoringMahasiswa(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitoring Mahasiswa</h1>
        <p className="text-sm text-muted-foreground">
          Aktivitas peminjaman alat oleh mahasiswa pada {courseCount} mata kuliah yang Anda ampu.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Peminjaman" value={summary.total} icon={BookMarked} tone="default" />
        <StatCard label="Sedang Dipinjam" value={summary.aktif} icon={Clock} tone="info" />
        <StatCard label="Menunggu Persetujuan" value={summary.menunggu} icon={GraduationCap} tone="warning" />
        <StatCard label="Selesai Dikembalikan" value={summary.selesai} icon={CheckCircle2} tone="success" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft">
        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-14 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {courseCount === 0
                ? "Anda belum terhubung ke jadwal mata kuliah manapun."
                : "Belum ada aktivitas peminjaman pada mata kuliah Anda."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {loans.map((loan) => (
              <div key={loan.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
                  <p className="font-medium text-foreground">{loan.mahasiswa.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.course?.nama} {loan.mahasiswa.prodi ? `— ${loan.mahasiswa.prodi}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {loan.items.map((i) => `${i.item.nama} (${i.jumlah})`).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTanggal(loan.tanggalPinjam)} – {formatTanggal(loan.tanggalKembali)}
                  </p>
                </div>
                <LoanStatusBadge status={loan.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
