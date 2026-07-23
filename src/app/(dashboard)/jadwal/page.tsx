import { requireRole } from "@/lib/auth";
import { CalendarCheck, CalendarClock, DoorOpen } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { JadwalClient } from "@/components/jadwal/jadwal-client";
import { getAllSchedules, getSedangBerlangsung, getBerikutnya, getRuanganStatus } from "@/lib/queries/jadwal";

export default async function JadwalPage() {
  await requireRole();

  const [schedules, sedangBerlangsung, berikutnya, ruanganStatus] = await Promise.all([
    getAllSchedules(),
    getSedangBerlangsung(),
    getBerikutnya(1),
    getRuanganStatus(),
  ]);

  const ruanganTersedia = ruanganStatus.filter((r) => r.tersedia).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Jadwal Praktikum</h1>
        <p className="text-sm text-muted-foreground">Jadwal perkuliahan/praktikum mingguan seluruh mata kuliah.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sedang Berlangsung" value={sedangBerlangsung.length} icon={CalendarCheck} tone="success" />
        <StatCard
          label="Berikutnya"
          value={berikutnya[0] ? `${berikutnya[0].course.nama} · ${berikutnya[0].hari}` : "—"}
          icon={CalendarClock}
          tone="info"
        />
        <StatCard label="Ruangan Tersedia" value={`${ruanganTersedia}/${ruanganStatus.length}`} icon={DoorOpen} tone="default" />
      </div>

      <JadwalClient schedules={schedules} />
    </div>
  );
}
