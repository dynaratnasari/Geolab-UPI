import { requireRole } from "@/lib/auth";
import { LaporanClient } from "@/components/laporan/laporan-client";

export default async function LaporanPage() {
  await requireRole("KEPALA_LAB");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan</h1>
        <p className="text-sm text-muted-foreground">Generate laporan inventaris, peminjaman, dan praktikum.</p>
      </div>
      <LaporanClient />
    </div>
  );
}
