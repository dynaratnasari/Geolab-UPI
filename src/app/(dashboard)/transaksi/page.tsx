import { requireRole } from "@/lib/auth";
import { TransaksiClient } from "@/components/transaksi/transaksi-client";

export default async function TransaksiPage() {
  await requireRole("LABORAN", "KEPALA_LAB");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitoring Barang Masuk/Keluar</h1>
        <p className="text-sm text-muted-foreground">Riwayat transaksi keluar-masuk barang secara realtime.</p>
      </div>
      <TransaksiClient />
    </div>
  );
}
