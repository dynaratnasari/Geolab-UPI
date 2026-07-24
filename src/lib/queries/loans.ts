import "server-only";
import { prisma } from "@/lib/prisma";

/** Lazily transitions overdue DIAMBIL loans to TERLAMBAT and notifies the mahasiswa. Called once
 *  per dashboard layout render so keterlambatan stays accurate everywhere without a cron job. */
export async function syncLoanKeterlambatan() {
  const overdue = await prisma.loan.findMany({
    where: { status: "DIAMBIL", tanggalKembali: { lt: new Date() } },
    select: { id: true, mahasiswaId: true, nomorPeminjaman: true },
  });
  if (overdue.length === 0) return;

  await prisma.$transaction([
    prisma.loan.updateMany({
      where: { id: { in: overdue.map((l) => l.id) } },
      data: { status: "TERLAMBAT" },
    }),
    ...overdue.map((l) =>
      prisma.notification.create({
        data: {
          profileId: l.mahasiswaId,
          type: "BARANG_TERLAMBAT",
          title: "Peminjaman terlambat dikembalikan",
          message: `Peminjaman ${l.nomorPeminjaman} sudah melewati batas waktu pengembalian. Segera kembalikan ke Laboran.`,
        },
      }),
    ),
  ]);
}
