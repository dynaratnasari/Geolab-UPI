import { Clock, MapPin } from "lucide-react";
import type { Course, Profile, Schedule } from "@prisma/client";

type ScheduleWithRelations = Schedule & { course: Course; dosen: Profile | null };

export function JadwalList({ schedules, emptyLabel }: { schedules: ScheduleWithRelations[]; emptyLabel: string }) {
  if (schedules.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {schedules.map((s) => (
        <li key={s.id} className="rounded-lg border border-border p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{s.course.nama}</p>
            <span className="shrink-0 rounded-full bg-upi-50 px-2 py-0.5 text-[11px] font-medium text-upi-700">
              {s.kelas}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {s.hari}, {s.jamMulai}–{s.jamSelesai}
            </span>
            {s.ruanganLabel && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {s.ruanganLabel}
              </span>
            )}
          </div>
          {s.dosen && <p className="mt-1 text-xs text-muted-foreground">{s.dosen.name}</p>}
        </li>
      ))}
    </ul>
  );
}
