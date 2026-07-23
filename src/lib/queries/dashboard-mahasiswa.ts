import "server-only";
import { prisma } from "@/lib/prisma";

/** Loans that are not yet finished (still somewhere in the approval/pickup/return flow). */
export async function getMahasiswaActiveLoans(mahasiswaId: string) {
  return prisma.loan.findMany({
    where: { mahasiswaId, status: { notIn: ["DIKEMBALIKAN", "DITOLAK"] } },
    include: { course: true, items: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMahasiswaRiwayatCount(mahasiswaId: string) {
  return prisma.loan.count({ where: { mahasiswaId, status: { in: ["DIKEMBALIKAN", "DITOLAK"] } } });
}
