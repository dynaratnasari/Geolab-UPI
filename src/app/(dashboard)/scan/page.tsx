import { requireRole } from "@/lib/auth";
import { ScanClient } from "@/components/scan/scan-client";

export default async function ScanPage() {
  await requireRole("LABORAN", "KEPALA_LAB");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Scan QR</h1>
        <p className="text-sm text-muted-foreground">
          Pindai QR pada label alat inventaris atau kupon peminjaman untuk membuka detailnya langsung.
        </p>
      </div>
      <ScanClient />
    </div>
  );
}
