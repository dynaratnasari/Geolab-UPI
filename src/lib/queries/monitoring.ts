import "server-only";
import { prisma } from "@/lib/prisma";

/** Loan activity for the courses a given dosen teaches (via Schedule.dosenId). */
export async function getMonitoringMahasiswa(dosenId: string) {
  const schedules = await prisma.schedule.findMany({
    where: { dosenId },
    select: { courseId: true },
    distinct: ["courseId"],
  });
  const courseIds = schedules.map((s) => s.courseId);

  const loans = courseIds.length === 0
    ? []
    : await prisma.loan.findMany({
        where: { courseId: { in: courseIds } },
        include: { mahasiswa: true, course: true, items: { include: { item: true, unit: true } } },
        orderBy: { createdAt: "desc" },
      });

  const summary = {
    total: loans.length,
    aktif: loans.filter((l) => l.status === "DIAMBIL" || l.status === "TERLAMBAT").length,
    menunggu: loans.filter((l) => l.status === "MENUNGGU_DOSEN" || l.status === "MENUNGGU_KEPALA_LAB").length,
    selesai: loans.filter((l) => l.status === "DIKEMBALIKAN").length,
  };

  return { loans, summary, courseCount: courseIds.length };
}
