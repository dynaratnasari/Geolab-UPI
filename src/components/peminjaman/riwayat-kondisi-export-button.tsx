"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RiwayatKondisiExportRow {
  nomorPeminjaman: string;
  tanggal: string;
  kondisi: string;
  alat: string;
  namaPeminjam: string;
  nim: string;
  prodi: string;
  keperluan: string;
  mataKuliah: string;
}

const TITLE = "SIP Geolab UPI - Riwayat Kondisi Pengembalian dalam Perhatian";

const HEADERS = [
  "Nomor Peminjaman",
  "Waktu Pengembalian",
  "Kondisi",
  "Alat (Tipe, Jumlah)",
  "Nama Peminjam",
  "NIM/NIK",
  "Prodi/Instansi",
  "Keperluan Peminjaman",
  "Mata Kuliah",
];

export function RiwayatKondisiExportButton({ rows }: { rows: RiwayatKondisiExportRow[] }) {
  async function handleExport() {
    const XLSX = await import("xlsx");

    const aoa = [
      [TITLE],
      [],
      HEADERS,
      ...rows.map((r) => [
        r.nomorPeminjaman,
        new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(
          new Date(r.tanggal),
        ),
        r.kondisi,
        r.alat,
        r.namaPeminjam,
        r.nim,
        r.prodi,
        r.keperluan,
        r.mataKuliah,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } }];
    ws["!cols"] = HEADERS.map(() => ({ wch: 24 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Kondisi");
    XLSX.writeFile(wb, `${TITLE}.xlsx`);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
      <FileSpreadsheet className="mr-1.5 h-4 w-4" />
      Export ke Excel
    </Button>
  );
}
