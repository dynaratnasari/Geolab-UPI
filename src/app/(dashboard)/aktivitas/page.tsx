import Link from "next/link";
import { History } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActivityLog } from "@/lib/queries/activity-log";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { ROLE_LABELS } from "@/lib/constants/roles";

const TYPE_LABEL: Record<string, string> = {
  BARANG_DIPINJAM: "Barang Diambil",
  BARANG_KEMBALI: "Pengembalian",
  APPROVAL: "Approval",
  UPDATE_KONDISI: "Update Kondisi",
  BARANG_MASUK: "Barang Masuk",
  BARANG_KELUAR: "Barang Keluar",
  KETERLAMBATAN: "Keterlambatan",
};

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}

function formatJam(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(date);
}

export default async function AktivitasPage() {
  await requireRole("KEPALA_LAB");
  const logs = await getActivityLog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Log Aktivitas</h1>
        <p className="text-sm text-muted-foreground">
          Riwayat lengkap setiap perubahan status peminjaman dan transaksi inventaris — tanggal, jam, pelaku, peran,
          status lama, status baru, dan catatan.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-14 text-center shadow-soft">
          <History className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <>
          {/* Desktop/tablet table */}
          <div className="hidden overflow-hidden rounded-xl border border-border shadow-soft md:block">
            <div className="max-h-[75vh] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-upi-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Tanggal &amp; Jam</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Peran</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Peminjaman</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Status Lama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Status Baru</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top transition-colors hover:bg-muted/50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatTanggal(log.createdAt)}
                        <br />
                        {formatJam(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{log.actor?.name ?? "Sistem"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.role ? ROLE_LABELS[log.role] : "—"}</td>
                      <td className="px-4 py-3">
                        {log.loan ? (
                          <Link href={`/peminjaman/${log.loan.id}`} className="font-mono text-xs text-upi-700 hover:underline">
                            {log.loan.nomorPeminjaman}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">{TYPE_LABEL[log.type] ?? log.type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{log.statusLama ? <LoanStatusBadge status={log.statusLama} /> : "—"}</td>
                      <td className="px-4 py-3">{log.statusBaru ? <LoanStatusBadge status={log.statusBaru} /> : "—"}</td>
                      <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">{log.catatan ?? log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {formatTanggal(log.createdAt)}, {formatJam(log.createdAt)}
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">{log.actor?.name ?? "Sistem"}</p>
                    <p className="text-xs text-muted-foreground">{log.role ? ROLE_LABELS[log.role] : "—"}</p>
                  </div>
                  {log.loan && (
                    <Link href={`/peminjaman/${log.loan.id}`} className="font-mono text-xs text-upi-700 hover:underline">
                      {log.loan.nomorPeminjaman}
                    </Link>
                  )}
                </div>
                {(log.statusLama || log.statusBaru) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {log.statusLama && <LoanStatusBadge status={log.statusLama} />}
                    <span className="text-muted-foreground">→</span>
                    {log.statusBaru && <LoanStatusBadge status={log.statusBaru} />}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{log.catatan ?? log.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
