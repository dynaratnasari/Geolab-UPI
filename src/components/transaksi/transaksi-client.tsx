"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, FileText, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionRow {
  id: string;
  type: "MASUK" | "KELUAR";
  tanggal: string;
  itemNama: string;
  jumlah: number;
  operatorNama: string;
  mahasiswaNama: string;
  status: string;
  catatan: string | null;
}

function formatTanggal(iso: string) {
  const d = new Date(iso);
  return {
    tanggal: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d),
    jam: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

export function TransaksiClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery<{ transactions: TransactionRow[] }>({
    queryKey: ["transaksi", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ ...(from && { from }), ...(to && { to }) });
      const res = await fetch(`/api/transaksi?${params.toString()}`);
      return res.json();
    },
  });

  const rows = data?.transactions ?? [];

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => {
      const { tanggal, jam } = formatTanggal(r.tanggal);
      return {
        Tanggal: tanggal,
        Jam: jam,
        Jenis: r.type === "MASUK" ? "Masuk" : "Keluar",
        "Nama Barang": r.itemNama,
        Jumlah: r.jumlah,
        Operator: r.operatorNama,
        Mahasiswa: r.mahasiswaNama,
        Status: r.status,
        Catatan: r.catatan ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barang Masuk Keluar");
    XLSX.writeFile(wb, `barang-masuk-keluar-${Date.now()}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Monitoring Barang Masuk / Keluar - GeoLab UPI", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Tanggal", "Jam", "Jenis", "Nama Barang", "Jumlah", "Operator", "Mahasiswa", "Status", "Catatan"]],
      body: rows.map((r) => {
        const { tanggal, jam } = formatTanggal(r.tanggal);
        return [
          tanggal,
          jam,
          r.type === "MASUK" ? "Masuk" : "Keluar",
          r.itemNama,
          String(r.jumlah),
          r.operatorNama,
          r.mahasiswaNama,
          r.status,
          r.catatan ?? "",
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
    });
    doc.save(`barang-masuk-keluar-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">
              Dari Tanggal
            </Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">
              Sampai Tanggal
            </Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={rows.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={rows.length === 0}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-14 text-center">
            <ArrowLeftRight className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Belum ada transaksi barang masuk/keluar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const { tanggal, jam } = formatTanggal(r.tanggal);
              return (
                <li key={r.id} className="flex items-center gap-4 px-4 py-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      r.type === "MASUK" ? "bg-emerald-50 text-emerald-600" : "bg-upi-50 text-upi-700",
                    )}
                  >
                    {r.type === "MASUK" ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.itemNama}</p>
                    <p className="text-xs text-muted-foreground">
                      {tanggal} · {jam} · {r.operatorNama}
                      {r.mahasiswaNama !== "—" && ` · ${r.mahasiswaNama}`}
                    </p>
                    {r.catatan && <p className="mt-0.5 text-xs italic text-muted-foreground">{r.catatan}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">{r.jumlah} unit</p>
                    <p className="text-xs text-muted-foreground">{r.status}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
