import "server-only";
import { prisma } from "@/lib/prisma";

/** Full structured audit trail — every loan status transition (plus inventory in/out),
 *  each with Tanggal/Jam (createdAt), User+Role (actor+role), Status Lama/Status Baru, Catatan. */
export async function getActivityLog(limit = 200) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { name: true } },
      loan: { select: { id: true, nomorPeminjaman: true } },
    },
  });
}
