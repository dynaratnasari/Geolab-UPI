"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FileSpreadsheet, FileText, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAPORAN_TYPES, type LaporanType, type LaporanResult } from "@/lib/constants/laporan";

export function LaporanClient() {
  const [type, setType] = useState<LaporanType>("inventaris");

  const { data, isLoading } = useQuery<LaporanResult>({
    queryKey: ["laporan", type],
    queryFn: async () => {
      const res = await fetch(`/api/laporan?type=${type}`);
      if (!res.ok) throw new Error("Gagal memuat laporan");
      return res.json();
    },
  });

  const label = LAPORAN_TYPES.find((t) => t.value === type)?.label ?? "";

  async function exportExcel() {
    if (!data) return;
    const XLSX = await import("xlsx");
    const rows = data.rows.map((row) => {
      const obj: Record<string, string | number> = {};
      for (const col of data.columns) obj[col.label] = row[col.key];
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `laporan-${type}-${Date.now()}.xlsx`);
  }

  async function exportPdf() {
    if (!data) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Laporan ${label} - GeoLab UPI`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [data.columns.map((c) => c.label)],
      body: data.rows.map((row) => data.columns.map((c) => String(row[c.key]))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
    });
    doc.save(`laporan-${type}-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LaporanType)}
            className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LAPORAN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={!data || data.rows.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={!data || data.rows.length === 0}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Memuat laporan...</p>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-14 text-center">
            <FileBarChart className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Tidak ada data untuk laporan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {data.columns.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((row, idx) => (
                  <tr key={idx}>
                    {data.columns.map((c) => (
                      <td key={c.key} className="whitespace-nowrap px-4 py-2.5 text-foreground">
                        {row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
