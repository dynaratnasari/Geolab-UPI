import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { KONDISI_LABEL, GOOD_RETURN_CONDITIONS, KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";
import { RiwayatKondisiExportButton, type RiwayatKondisiExportRow } from "@/components/peminjaman/riwayat-kondisi-export-button";

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

export default async function RiwayatKondisiPerhatianPage() {
  await requireRole("KEPALA_LAB", "LABORAN");

  const returns = await prisma.returnRecord.findMany({
    where: { kondisi: { notIn: GOOD_RETURN_CONDITIONS } },
    include: {
      loan: { include: { mahasiswa: true, course: true, items: { include: { item: true, unit: true } } } },
    },
    orderBy: { tanggal: "desc" },
  });

  const exportRows: RiwayatKondisiExportRow[] = returns.map((r) => ({
    nomorPeminjaman: r.loan.nomorPeminjaman,
    tanggal: r.tanggal.toISOString(),
    kondisi: KONDISI_LABEL[r.kondisi],
    alat: r.loan.items
      .map((i) => `${i.item.nama} (${i.item.tipeAlat}${i.unit ? `, ${i.unit.kodeUnit}` : `, ${i.jumlah} unit`})`)
      .join("; "),
    namaPeminjam: r.loan.mahasiswa.name,
    nim: r.loan.mahasiswa.nim ?? "—",
    prodi: r.loan.prodi ?? "—",
    keperluan: `${KEPERLUAN_LABEL[r.loan.jenisKeperluan]}${r.loan.keperluan ? ` — ${r.loan.keperluan}` : ""}`,
    mataKuliah: r.loan.course?.nama ?? "—",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/approval" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Approval & Serah Terima
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Riwayat Kondisi Pengembalian dalam Perhatian</h1>
          <p className="text-sm text-muted-foreground">
            Semua barang yang pernah dipinjam dan kembali dalam keadaan tidak baik (rusak/hilang).
          </p>
        </div>
        <RiwayatKondisiExportButton rows={exportRows} />
      </div>

      {returns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-14 text-center shadow-soft">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Belum ada riwayat pengembalian dalam kondisi tidak baik.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <Card key={r.id} className="shadow-soft">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{r.loan.nomorPeminjaman}</p>
                  <Link href={`/peminjaman/${r.loan.id}`} className="font-medium text-foreground hover:underline">
                    {r.loan.mahasiswa.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.loan.items
                      .map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : `${i.item.nama} (${i.jumlah})`))
                      .join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTanggal(r.tanggal)}
                    {r.pemeriksaNama ? ` · Diperiksa oleh ${r.pemeriksaNama}` : ""}
                  </p>
                  {r.catatan && <p className="mt-1 text-xs text-muted-foreground">{r.catatan}</p>}
                </div>
                <p className="shrink-0 text-sm font-semibold text-red-600">{KONDISI_LABEL[r.kondisi]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
