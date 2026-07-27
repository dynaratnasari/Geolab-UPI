import "server-only";
import { prisma } from "@/lib/prisma";
import type { LoanStatus } from "@prisma/client";

const RETURNED_STATUSES: LoanStatus[] = ["RETURNED", "RETURNED_DAMAGED", "RETURNED_LOST", "COMPLETED"];

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
    aktif: loans.filter((l) => l.status === "BORROWED" || l.status === "OVERDUE").length,
    menunggu: loans.filter((l) => l.status === "WAITING_LABORAN_APPROVAL" || l.status === "WAITING_HEAD_APPROVAL").length,
    selesai: loans.filter((l) => RETURNED_STATUSES.includes(l.status)).length,
  };

  return { loans, summary, courseCount: courseIds.length };
}
