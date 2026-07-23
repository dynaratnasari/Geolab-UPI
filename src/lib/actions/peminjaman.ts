"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLoanSchema, type CreateLoanInput } from "@/lib/validations/peminjaman";

export async function createLoan(input: CreateLoanInput) {
  const profile = await requireRole("MAHASISWA");
  const data = createLoanSchema.parse(input);

  // Re-validate stock server-side against the live database (client-side check is only advisory).
  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: data.items.map((i) => i.itemId) } },
  });
  const unitIds = data.items.map((i) => i.unitId).filter((id): id is string => Boolean(id));
  const units = unitIds.length
    ? await prisma.inventoryUnit.findMany({ where: { id: { in: unitIds } } })
    : [];

  for (const requested of data.items) {
    const item = items.find((i) => i.id === requested.itemId);
    if (!item) throw new Error(`Barang "${requested.nama}" tidak ditemukan.`);

    if (requested.unitId) {
      const unit = units.find((u) => u.id === requested.unitId && u.itemId === requested.itemId);
      if (!unit || unit.status !== "TERSEDIA") {
        throw new Error(`Unit "${requested.kodeUnit ?? requested.nama}" sudah tidak tersedia.`);
      }
    } else if (requested.jumlah > item.jumlahTersedia) {
      throw new Error(`Stok "${item.nama}" tidak mencukupi.`);
    }
  }

  const countThisYear = await prisma.loan.count({
    where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
  });
  const nomorPeminjaman = `PJM-${new Date().getFullYear()}-${String(countThisYear + 1).padStart(4, "0")}`;

  // Praktikum/Riset skip straight to Laboran (no Dosen/Kepala Lab gate).
  // Kegiatan Lainnya still needs Kepala Lab's approval first.
  const needsKepalaLab = data.jenisKeperluan === "LAINNYA";

  // Dosen pengampu is derived from the course's own schedule (never free-typed), so spelling stays consistent.
  const schedule = await prisma.schedule.findFirst({
    where: { courseId: data.courseId, dosenId: { not: null } },
    include: { dosen: true },
  });
  const dosenPengampu = schedule?.dosen?.name ?? null;

  const loan = await prisma.loan.create({
    data: {
      nomorPeminjaman,
      mahasiswaId: profile.id,
      prodi: profile.prodi,
      courseId: data.courseId,
      dosenPengampu,
      tanggalPinjam: new Date(data.tanggalPinjam),
      tanggalKembali: new Date(data.tanggalKembali),
      jam: data.jam,
      jenisKeperluan: data.jenisKeperluan,
      keperluan: data.keperluan,
      suratUrl: data.suratUrl,
      status: needsKepalaLab ? "MENUNGGU_KEPALA_LAB" : "DISETUJUI",
      items: {
        create: data.items.map((i) => ({ itemId: i.itemId, unitId: i.unitId, jumlah: i.jumlah })),
      },
      approvals: {
        create: { level: needsKepalaLab ? "KEPALA_LAB" : "LABORAN", status: "MENUNGGU" },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "APPROVAL",
      actorId: profile.id,
      message: `${profile.name} mengajukan peminjaman ${nomorPeminjaman}.`,
    },
  });

  revalidatePath("/peminjaman");
  return { loanId: loan.id };
}
