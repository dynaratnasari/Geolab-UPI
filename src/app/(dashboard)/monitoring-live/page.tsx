import { requireRole } from "@/lib/auth";
import { MonitoringLiveClient } from "@/components/monitoring/monitoring-live-client";

export default async function MonitoringLivePage() {
  await requireRole("KEPALA_LAB", "LABORAN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitoring Live</h1>
        <p className="text-sm text-muted-foreground">
          Alat yang sedang digunakan/dipinjam saat ini — siapa peminjamnya, untuk keperluan apa, dan di mana.
        </p>
      </div>
      <MonitoringLiveClient />
    </div>
  );
}
