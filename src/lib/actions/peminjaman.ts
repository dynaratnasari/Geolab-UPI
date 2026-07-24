"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLoanSchema, type CreateLoanInput } from "@/lib/validations/peminjaman";

/** Combines a "YYYY-MM-DD" date with a "HH.MM" jam slot and parses it as WIB (UTC+7) —
 *  the lab's local time — regardless of the server process's own timezone. */
function parseTanggalJam(tanggal: string, jam: string): Date {
  const [hour, minute] = jam.split(".");
  return new Date(`${tanggal}T${hour}:${minute}:00+07:00`);
}

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

  // Only Praktikum skips straight to Laboran; Riset and Kegiatan Lainnya need Kepala Lab's approval first.
  const needsKepalaLab = data.jenisKeperluan !== "PRAKTIKUM";

  // Dosen pengampu is derived from the course's own schedule (never free-typed), so spelling stays consistent.
  // Riset/Kegiatan Lainnya have no course, so there's no dosen pengampu to derive.
  const schedule = data.courseId
    ? await prisma.schedule.findFirst({
        where: { courseId: data.courseId, dosenId: { not: null } },
        include: { dosen: true },
      })
    : null;
  const dosenPengampu = schedule?.dosen?.name ?? null;

  const loan = await prisma.loan.create({
    data: {
      nomorPeminjaman,
      mahasiswaId: profile.id,
      prodi: profile.prodi,
      courseId: data.jenisKeperluan === "PRAKTIKUM" ? data.courseId : undefined,
      dosenPengampu,
      tanggalPinjam: parseTanggalJam(data.tanggalPinjam, data.jamPinjam),
      tanggalKembali: parseTanggalJam(data.tanggalKembali, data.jamKembali),
      jenisKeperluan: data.jenisKeperluan,
      keperluan: data.keperluan,
      suratUrl: data.suratUrl,
      // Riset/Kegiatan Lainnya start at Laboran's first-stage approval, then Kepala Lab; Praktikum
      // skips both and is ready for pickup immediately.
      status: needsKepalaLab ? "MENUNGGU_LABORAN" : "DISETUJUI",
      items: {
        create: data.items.map((i) => ({ itemId: i.itemId, unitId: i.unitId, jumlah: i.jumlah })),
      },
      approvals: {
        create: { level: "LABORAN", status: "MENUNGGU" },
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
