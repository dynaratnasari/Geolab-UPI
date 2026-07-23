"use client";

import { useState } from "react";
import { List, LayoutGrid, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HARI_URUT } from "@/lib/constants/hari";
import type { Course, Profile, Schedule } from "@prisma/client";

type ScheduleWithRelations = Schedule & { course: Course; dosen: Profile | null };

export function JadwalClient({ schedules }: { schedules: ScheduleWithRelations[] }) {
  const [view, setView] = useState<"list" | "week">("list");

  const byHari = new Map<string, ScheduleWithRelations[]>();
  for (const s of schedules) {
    const list = byHari.get(s.hari) ?? [];
    list.push(s);
    byHari.set(s.hari, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>
            <List className="h-4 w-4" />
            List
          </Button>
          <Button variant={view === "week" ? "secondary" : "ghost"} size="sm" onClick={() => setView("week")}>
            <LayoutGrid className="h-4 w-4" />
            Minggu
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-6">
          {HARI_URUT.filter((h) => byHari.has(h)).map((hari) => (
            <div key={hari}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{hari}</h3>
              <div className="space-y-2">
                {byHari.get(hari)!.map((s) => (
                  <ScheduleCard key={s.id} schedule={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {HARI_URUT.map((hari) => (
            <div key={hari} className="min-w-0">
              <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {hari}
              </h3>
              <div className="space-y-2">
                {(byHari.get(hari) ?? []).map((s) => (
                  <ScheduleCard key={s.id} schedule={s} compact />
                ))}
                {!byHari.get(hari)?.length && (
                  <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Tidak ada jadwal
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ schedule, compact }: { schedule: ScheduleWithRelations; compact?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className={compact ? "text-xs font-medium text-foreground" : "text-sm font-medium text-foreground"}>
          {schedule.course.nama}
        </p>
        {schedule.kelas && (
          <span className="shrink-0 rounded-full bg-upi-50 px-2 py-0.5 text-[10px] font-medium text-upi-700">
            {schedule.kelas}
          </span>
        )}
      </div>
      <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {schedule.jamMulai}–{schedule.jamSelesai}
        </p>
        {schedule.ruanganLabel && (
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {schedule.ruanganLabel}
          </p>
        )}
        {schedule.dosen && (
          <p className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {schedule.dosen.name}
          </p>
        )}
      </div>
    </div>
  );
}
