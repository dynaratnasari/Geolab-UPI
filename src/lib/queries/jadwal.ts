import "server-only";
import { prisma } from "@/lib/prisma";
import { HARI_INDONESIA, HARI_URUT } from "@/lib/constants/hari";

const scheduleInclude = { course: true, dosen: true } as const;

export async function getAllSchedules() {
  const schedules = await prisma.schedule.findMany({ include: scheduleInclude });
  return schedules.sort((a, b) => {
    const dayDiff = HARI_URUT.indexOf(a.hari) - HARI_URUT.indexOf(b.hari);
    return dayDiff !== 0 ? dayDiff : a.jamMulai.localeCompare(b.jamMulai);
  });
}

function jamSekarang() {
  return new Date().toTimeString().slice(0, 5).replace(":", ".");
}

export async function getSedangBerlangsung() {
  const hariIni = HARI_INDONESIA[new Date().getDay()];
  const now = jamSekarang();
  return prisma.schedule.findMany({
    where: { hari: hariIni, jamMulai: { lte: now }, jamSelesai: { gte: now } },
    include: scheduleInclude,
    orderBy: { jamMulai: "asc" },
  });
}

export async function getBerikutnya(limit = 5) {
  const todayIndex = new Date().getDay();
  const now = jamSekarang();
  const all = await prisma.schedule.findMany({ include: scheduleInclude });

  return all
    .map((s) => {
      const dayIndex = HARI_INDONESIA.indexOf(s.hari);
      let delta = dayIndex === -1 ? 7 : (dayIndex - todayIndex + 7) % 7;
      if (delta === 0 && s.jamMulai <= now) delta = 7;
      return { schedule: s, delta };
    })
    .sort((a, b) => a.delta - b.delta || a.schedule.jamMulai.localeCompare(b.schedule.jamMulai))
    .slice(0, limit)
    .map((x) => x.schedule);
}

export async function getRuanganStatus() {
  const all = await prisma.schedule.findMany({ include: scheduleInclude });
  const hariIni = HARI_INDONESIA[new Date().getDay()];
  const now = jamSekarang();

  const ruanganSet = new Set(all.map((s) => s.ruanganLabel).filter((r): r is string => !!r));
  return Array.from(ruanganSet)
    .sort()
    .map((ruangan) => {
      const sedang = all.find(
        (s) => s.ruanganLabel === ruangan && s.hari === hariIni && s.jamMulai <= now && s.jamSelesai >= now,
      );
      return { ruangan, tersedia: !sedang, sedangDigunakan: sedang?.course.nama };
    });
}
