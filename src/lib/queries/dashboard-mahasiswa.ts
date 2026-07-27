import "server-only";
import { prisma } from "@/lib/prisma";
import { TERMINAL_LOAN_STATUSES } from "@/lib/constants/peminjaman";

/** Loans that are not yet finished (still somewhere in the approval/pickup/return flow). */
export async function getMahasiswaActiveLoans(mahasiswaId: string) {
  return prisma.loan.findMany({
    where: { mahasiswaId, status: { notIn: TERMINAL_LOAN_STATUSES } },
    include: { course: true, items: { include: { item: true, unit: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMahasiswaRiwayatCount(mahasiswaId: string) {
  return prisma.loan.count({ where: { mahasiswaId, status: { in: TERMINAL_LOAN_STATUSES } } });
}
