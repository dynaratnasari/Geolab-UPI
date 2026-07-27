import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncLoanKeterlambatan } from "@/lib/queries/loans";

/** Polled by the staff live-monitoring dashboard — every active loan with borrower,
 *  purpose, and location context, plus aggregate counters. */
export async function GET() {
  await requireRole("KEPALA_LAB", "LABORAN");
  await syncLoanKeterlambatan();

  const loans = await prisma.loan.findMany({
    where: { status: { in: ["BORROWED", "OVERDUE"] } },
    orderBy: { tanggalKembali: "asc" },
    include: {
      mahasiswa: { select: { name: true, nim: true, prodi: true, phone: true } },
      course: { select: { nama: true, schedules: { select: { ruanganLabel: true }, take: 1 } } },
      items: { include: { item: { select: { nama: true } }, unit: { select: { kodeUnit: true } } } },
    },
  });

  const totalUnitKeluar = loans.reduce((sum, l) => sum + l.items.reduce((s, li) => s + li.jumlah, 0), 0);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    summary: {
      peminjamanAktif: loans.length,
      terlambat: loans.filter((l) => l.status === "OVERDUE").length,
      unitKeluar: totalUnitKeluar,
    },
    loans: loans.map((l) => ({
      id: l.id,
      nomorPeminjaman: l.nomorPeminjaman,
      status: l.status,
      mahasiswa: l.mahasiswa,
      jenisKeperluan: l.jenisKeperluan,
      keperluan: l.keperluan,
      mataKuliah: l.course?.nama ?? null,
      lokasi: l.course?.schedules[0]?.ruanganLabel ?? null,
      barang: l.items.map((li) => ({
        nama: li.item.nama,
        kodeUnit: li.unit?.kodeUnit ?? null,
        jumlah: li.jumlah,
      })),
      tanggalPinjam: l.tanggalPinjam.toISOString(),
      tanggalKembali: l.tanggalKembali.toISOString(),
    })),
  });
}
