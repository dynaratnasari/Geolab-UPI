import "server-only";
import { prisma } from "@/lib/prisma";
import { notifyRole } from "@/lib/notify";

/** Lazily transitions overdue BORROWED loans to OVERDUE and notifies the mahasiswa, every
 *  Laboran, and every Kepala Lab. Called once per dashboard layout render so keterlambatan
 *  stays accurate everywhere without a cron job. Resolves itself once the loan is returned —
 *  OVERDUE is just BORROWED past its due date, not a separate track. */
export async function syncLoanKeterlambatan() {
  const overdue = await prisma.loan.findMany({
    where: { status: "BORROWED", tanggalKembali: { lt: new Date() } },
    select: { id: true, mahasiswaId: true, nomorPeminjaman: true },
  });
  if (overdue.length === 0) return;

  const staffNotifications = (
    await Promise.all(
      overdue.flatMap((l) => [
        notifyRole("LABORAN", {
          type: "BARANG_TERLAMBAT",
          title: "Peminjaman terlambat",
          message: `Peminjaman ${l.nomorPeminjaman} sudah melewati batas waktu pengembalian.`,
        }),
        notifyRole("KEPALA_LAB", {
          type: "BARANG_TERLAMBAT",
          title: "Peminjaman terlambat",
          message: `Peminjaman ${l.nomorPeminjaman} sudah melewati batas waktu pengembalian.`,
        }),
      ]),
    )
  ).flat();

  await prisma.$transaction([
    prisma.loan.updateMany({
      where: { id: { in: overdue.map((l) => l.id) } },
      data: { status: "OVERDUE" },
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
    ...staffNotifications,
  ]);
}
