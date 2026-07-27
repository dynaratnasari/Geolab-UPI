import "server-only";
import { prisma } from "@/lib/prisma";
import { HARI_URUT } from "@/lib/constants/hari";

const scheduleInclude = { course: true, dosen: true } as const;

export async function getAllSchedules() {
  const schedules = await prisma.schedule.findMany({ include: scheduleInclude });
  return schedules.sort((a, b) => {
    const dayDiff = HARI_URUT.indexOf(a.hari) - HARI_URUT.indexOf(b.hari);
    return dayDiff !== 0 ? dayDiff : a.jamMulai.localeCompare(b.jamMulai);
  });
}
