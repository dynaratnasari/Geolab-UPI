"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlarmClock, PackageCheck, RefreshCw, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";
import type { KeperluanType, LoanStatus } from "@prisma/client";

interface LiveLoan {
  id: string;
  nomorPeminjaman: string;
  status: LoanStatus;
  mahasiswa: { name: string; nim: string | null; prodi: string | null; phone: string | null };
  jenisKeperluan: KeperluanType;
  keperluan: string | null;
  mataKuliah: string | null;
  lokasi: string | null;
  barang: { nama: string; kodeUnit: string | null; jumlah: number }[];
  tanggalPinjam: string;
  tanggalKembali: string;
}

interface LiveData {
  updatedAt: string;
  summary: { peminjamanAktif: number; terlambat: number; unitKeluar: number };
  loans: LiveLoan[];
}

function formatWaktu(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function MonitoringLiveClient() {
  const { data, isFetching, dataUpdatedAt } = useQuery<LiveData>({
    queryKey: ["monitoring-live"],
    queryFn: async () => {
      const res = await fetch("/api/monitoring-live");
      if (!res.ok) throw new Error("Gagal memuat data monitoring.");
      return res.json();
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {dataUpdatedAt
          ? `Diperbarui otomatis tiap 15 detik · terakhir ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(dataUpdatedAt))}`
          : "Memuat..."}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Peminjaman Aktif" value={data?.summary.peminjamanAktif ?? 0} icon={Activity} tone="info" />
        <StatCard label="Unit Alat di Luar" value={data?.summary.unitKeluar ?? 0} icon={PackageCheck} tone="default" />
        <StatCard label="Terlambat" value={data?.summary.terlambat ?? 0} icon={AlarmClock} tone="warning" />
      </div>

      {!data || data.loans.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <PackageCheck className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {data ? "Tidak ada alat yang sedang dipinjam saat ini — semua alat ada di lab." : "Memuat data..."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.loans.map((loan) => (
            <Card key={loan.id} className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
                      <LoanStatusBadge status={loan.status} />
                    </div>

                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                      {loan.barang
                        .map((b) => (b.kodeUnit ? `${b.nama} (${b.kodeUnit})` : `${b.nama} × ${b.jumlah}`))
                        .join(", ")}
                    </p>

                    <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-foreground">{loan.mahasiswa.name}</span>
                        {loan.mahasiswa.nim && ` · NIM ${loan.mahasiswa.nim}`}
                        {loan.mahasiswa.prodi && ` · ${loan.mahasiswa.prodi}`}
                      </p>
                      <p>
                        Keperluan: {KEPERLUAN_LABEL[loan.jenisKeperluan]}
                        {loan.mataKuliah && ` — ${loan.mataKuliah}`}
                        {loan.keperluan && ` — ${loan.keperluan}`}
                      </p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {loan.lokasi ?? "Lokasi penggunaan tidak tercatat"}
                      </p>
                      {loan.mahasiswa.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {loan.mahasiswa.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p>Dipinjam: {formatWaktu(loan.tanggalPinjam)}</p>
                    <p className={loan.status === "OVERDUE" ? "font-medium text-orange-600" : undefined}>
                      Kembali: {formatWaktu(loan.tanggalKembali)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
