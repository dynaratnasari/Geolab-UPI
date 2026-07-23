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
  for (const requested of data.items) {
    const item = items.find((i) => i.id === requested.itemId);
    if (!item || requested.jumlah > item.jumlahTersedia) {
      throw new Error(`Stok "${item?.nama ?? requested.nama}" tidak mencukupi.`);
    }
  }

  const countThisYear = await prisma.loan.count({
    where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
  });
  const nomorPeminjaman = `PJM-${new Date().getFullYear()}-${String(countThisYear + 1).padStart(4, "0")}`;

  const loan = await prisma.loan.create({
    data: {
      nomorPeminjaman,
      mahasiswaId: profile.id,
      prodi: profile.prodi,
      courseId: data.courseId,
      dosenPengampu: data.dosenPengampu,
      tanggalPinjam: new Date(data.tanggalPinjam),
      tanggalKembali: new Date(data.tanggalKembali),
      jam: data.jam,
      keperluan: data.keperluan,
      suratUrl: data.suratUrl,
      status: "MENUNGGU_DOSEN",
      items: {
        create: data.items.map((i) => ({ itemId: i.itemId, jumlah: i.jumlah })),
      },
      approvals: {
        create: { level: "DOSEN", status: "MENUNGGU" },
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
