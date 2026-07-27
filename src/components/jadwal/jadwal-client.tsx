"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Play, FastForward, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { HARI_URUT, HARI_INDONESIA } from "@/lib/constants/hari";
import type { Course, Profile, Schedule } from "@prisma/client";

type ScheduleWithRelations = Schedule & { course: Course; dosen: Profile | null };
type DisplayStatus = "SELESAI" | "BERJALAN" | "MENDATANG" | "BENTROK";

const STATUS_LABEL: Record<DisplayStatus, string> = {
  SELESAI: "Selesai",
  BERJALAN: "Berjalan",
  MENDATANG: "Mendatang",
  BENTROK: "Bentrok",
};

const STATUS_SWATCH: Record<DisplayStatus, string> = {
  SELESAI: "bg-slate-300",
  BERJALAN: "bg-emerald-500",
  MENDATANG: "border border-slate-400 bg-white",
  BENTROK: "bg-red-500",
};

const STATUS_BADGE: Record<DisplayStatus, string> = {
  SELESAI: "bg-slate-100 text-slate-500",
  BERJALAN: "bg-emerald-100 text-emerald-700",
  MENDATANG: "border border-slate-300 bg-white text-slate-500",
  BENTROK: "bg-red-100 text-red-700",
};

function jamSekarang(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Status tiap jadwal dihitung murni dari waktu saat ini (bukan kolom status di DB, yang
 *  dipakai untuk hal lain seperti pembatalan manual) — SELESAI/BERJALAN/MENDATANG dari posisi
 *  hari+jam relatif terhadap sekarang, dan BENTROK menimpa keduanya kalau dua jadwal berbeda
 *  berbagi hari+ruangan yang sama dengan jam yang tumpang tindih. */
function computeJadwal(schedules: ScheduleWithRelations[], now: Date) {
  const todayHari = HARI_INDONESIA[now.getDay()];
  const todayIdx = HARI_URUT.indexOf(todayHari);
  const nowJam = jamSekarang(now);

  const statusMap = new Map<string, DisplayStatus>();
  for (const s of schedules) {
    const idx = HARI_URUT.indexOf(s.hari);
    let status: DisplayStatus;
    if (idx === -1) status = "MENDATANG";
    else if (idx < todayIdx) status = "SELESAI";
    else if (idx > todayIdx) status = "MENDATANG";
    else if (nowJam >= s.jamSelesai) status = "SELESAI";
    else if (nowJam >= s.jamMulai) status = "BERJALAN";
    else status = "MENDATANG";
    statusMap.set(s.id, status);
  }

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (a.hari === b.hari && a.ruanganLabel && a.ruanganLabel === b.ruanganLabel) {
        if (a.jamMulai < b.jamSelesai && b.jamMulai < a.jamSelesai) {
          statusMap.set(a.id, "BENTROK");
          statusMap.set(b.id, "BENTROK");
        }
      }
    }
  }

  const berjalan = schedules
    .filter((s) => statusMap.get(s.id) === "BERJALAN")
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  const berikutnya = schedules
    .map((s) => {
      const idx = HARI_URUT.indexOf(s.hari);
      let delta = idx === -1 ? 999 : (idx - todayIdx + 7) % 7;
      if (delta === 0 && s.jamMulai <= nowJam) delta = 7;
      return { schedule: s, delta };
    })
    .sort((a, b) => a.delta - b.delta || a.schedule.jamMulai.localeCompare(b.schedule.jamMulai))[0];

  return { statusMap, berjalan, berikutnya };
}

function minutesUntil(now: Date, deltaDays: number, jam: string) {
  const [h, m] = jam.split(".").map(Number);
  const target = new Date(now);
  target.setDate(target.getDate() + deltaDays);
  target.setHours(h, m, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
}

function formatCountdown(totalMinutes: number) {
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} Menit`);
  return parts.join(" ");
}

export function JadwalClient({ schedules }: { schedules: ScheduleWithRelations[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { statusMap, berjalan, berikutnya } = useMemo(() => computeJadwal(schedules, now), [schedules, now]);

  const byHari = useMemo(() => {
    const map = new Map<string, ScheduleWithRelations[]>();
    for (const s of schedules) {
      const list = map.get(s.hari) ?? [];
      list.push(s);
      map.set(s.hari, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    return map;
  }, [schedules]);

  const hariWithData = HARI_URUT.filter((h) => byHari.has(h));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Jadwal Praktikum Laboratorium</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(Object.keys(STATUS_LABEL) as DisplayStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-sm", STATUS_SWATCH[s])} />
              {STATUS_LABEL[s].toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Status Real-time</p>
            <p className="truncate text-base font-bold text-emerald-900">
              {berjalan.length === 0
                ? "Tidak ada praktikum yang berjalan saat ini"
                : `${berjalan[0].course.nama}${berjalan[0].kelas ? ` (${berjalan[0].kelas})` : ""} sedang berlangsung${
                    berjalan.length > 1 ? ` · +${berjalan.length - 1} lainnya` : ""
                  }`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-soft">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600">
            <FastForward className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">Praktikum Berikutnya</p>
            {berikutnya ? (
              <>
                <p className="truncate text-base font-bold text-indigo-900">
                  {berikutnya.schedule.course.nama}
                  {berikutnya.schedule.kelas ? ` (${berikutnya.schedule.kelas})` : ""}
                </p>
                <span className="mt-1 inline-block rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700 shadow-sm">
                  Mulai dalam {formatCountdown(minutesUntil(now, berikutnya.delta, berikutnya.schedule.jamMulai))}
                </span>
              </>
            ) : (
              <p className="text-base font-bold text-indigo-900">Tidak ada jadwal berikutnya</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {hariWithData.map((hari) => (
          <div key={hari} className="min-w-0 overflow-hidden rounded-xl border border-border">
            <div className="bg-slate-100 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
              {hari}
            </div>
            <div className="space-y-3 bg-muted/30 p-3">
              {byHari.get(hari)!.map((s) => {
                const status = statusMap.get(s.id)!;
                return (
                  <div key={s.id} className="rounded-xl border border-border bg-card p-3.5 shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-snug text-foreground">{s.course.nama}</p>
                      {s.kelas && (
                        <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {s.kelas}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {s.jamMulai} – {s.jamSelesai}
                    </p>
                    {s.ruanganLabel && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.ruanganLabel}
                      </p>
                    )}
                    <div className="mt-3 border-t border-border pt-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                          STATUS_BADGE[status],
                        )}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!byHari.get(hari)?.length && (
                <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Tidak ada jadwal
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
