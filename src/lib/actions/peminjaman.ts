"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLoanSchema, type CreateLoanInput } from "@/lib/validations/peminjaman";
import { isMahasiswaProfileComplete } from "@/lib/profile-completeness";

/** Combines a "YYYY-MM-DD" date with a "HH.MM" jam slot and parses it as WIB (UTC+7) —
 *  the lab's local time — regardless of the server process's own timezone. */
function parseTanggalJam(tanggal: string, jam: string): Date {
  const [hour, minute] = jam.split(".");
  return new Date(`${tanggal}T${hour}:${minute}:00+07:00`);
}

export async function createLoan(input: CreateLoanInput) {
  const profile = await requireRole("MAHASISWA");
  if (!isMahasiswaProfileComplete(profile)) {
    throw new Error("Lengkapi profil Anda terlebih dahulu sebelum mengajukan peminjaman.");
  }
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

  // Dosen pengampu is derived from the course's own schedule (never free-typed), so spelling stays consistent.
  // Riset/Kegiatan Lainnya have no course, so there's no dosen pengampu to derive.
  const schedule = data.courseId
    ? await prisma.schedule.findFirst({
        where: { courseId: data.courseId, dosenId: { not: null } },
        include: { dosen: true },
      })
    : null;
  const dosenPengampu = schedule?.dosen?.name ?? null;

  // Dosen pembimbing is normally picked from a search-select over real DOSEN profiles
  // (re-verified server-side against a stale/tampered client value, same reasoning as
  // dosenWaliId) — but if the dosen isn't in that list, the mahasiswa can type the name
  // free-form instead ("Dosen Lainnya"), stored separately in dosenPembimbingNama.
  if (data.jenisKeperluan === "RISET") {
    if (data.dosenPembimbingId) {
      const dosenPembimbing = await prisma.profile.findUnique({ where: { id: data.dosenPembimbingId } });
      if (!dosenPembimbing || dosenPembimbing.role !== "DOSEN") {
        throw new Error("Dosen pembimbing tidak valid.");
      }
    } else if ((data.dosenPembimbingNama?.trim().length ?? 0) < 3) {
      throw new Error("Dosen pembimbing wajib diisi.");
    }
  }

  // Every jenisKeperluan starts identically at Laboran's approval — Praktikum vs Riset/Lainnya
  // only diverge afterward, inside approveLaboran(), on whether Kepala Lab is needed next.
  // Notifications need the loan's id, which doesn't exist until it's created, so this uses an
  // interactive transaction (not the array form) to create the loan first and notify right after.
  const laboranProfiles = await prisma.profile.findMany({ where: { role: "LABORAN" }, select: { id: true } });

  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.loan.create({
      data: {
        nomorPeminjaman,
        mahasiswaId: profile.id,
        prodi: profile.prodi,
        courseId: data.jenisKeperluan === "PRAKTIKUM" ? data.courseId : undefined,
        dosenPengampu,
        kelompok: data.jenisKeperluan === "PRAKTIKUM" ? data.kelompok || undefined : undefined,
        dosenPembimbingId: data.jenisKeperluan === "RISET" ? data.dosenPembimbingId || undefined : undefined,
        dosenPembimbingNama:
          data.jenisKeperluan === "RISET" && !data.dosenPembimbingId ? data.dosenPembimbingNama : undefined,
        lokasi: data.jenisKeperluan === "RISET" || data.jenisKeperluan === "LAINNYA" ? data.lokasi : undefined,
        tanggalPinjam: parseTanggalJam(data.tanggalPinjam, data.jamPinjam),
        tanggalKembali: parseTanggalJam(data.tanggalKembali, data.jamKembali),
        jenisKeperluan: data.jenisKeperluan,
        keperluan: data.keperluan,
        suratUrl: data.suratUrl,
        status: "WAITING_LABORAN_APPROVAL",
        items: {
          create: data.items.map((i) => ({ itemId: i.itemId, unitId: i.unitId, jumlah: i.jumlah })),
        },
        approvals: {
          create: { level: "LABORAN", status: "MENUNGGU" },
        },
        activityLogs: {
          create: {
            type: "APPROVAL",
            actorId: profile.id,
            role: profile.role,
            statusBaru: "WAITING_LABORAN_APPROVAL",
            message: `${profile.name} mengajukan peminjaman ${nomorPeminjaman}.`,
          },
        },
      },
    });

    if (laboranProfiles.length) {
      await tx.notification.createMany({
        data: laboranProfiles.map((p) => ({
          profileId: p.id,
          type: "APPROVAL_BARU" as const,
          title: "Pengajuan peminjaman baru",
          message: `${profile.name} mengajukan peminjaman ${nomorPeminjaman}, menunggu persetujuan Anda.`,
          loanId: created.id,
        })),
      });
    }

    return created;
  });

  revalidatePath("/peminjaman");
  revalidatePath("/approval");
  return { loanId: loan.id };
}

/** Mahasiswa can withdraw their own request before any staff decision has been made. */
export async function cancelLoan(loanId: string) {
  const profile = await requireRole("MAHASISWA");
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");
  if (loan.mahasiswaId !== profile.id) throw new Error("Anda tidak berhak membatalkan peminjaman ini.");
  if (loan.status !== "WAITING_LABORAN_APPROVAL" && loan.status !== "WAITING_HEAD_APPROVAL") {
    throw new Error("Peminjaman ini sudah diproses dan tidak dapat dibatalkan sendiri.");
  }

  await prisma.$transaction([
    prisma.loan.update({ where: { id: loanId }, data: { status: "CANCELLED" } }),
    prisma.activityLog.create({
      data: {
        type: "APPROVAL",
        actorId: profile.id,
        role: profile.role,
        loanId,
        statusLama: loan.status,
        statusBaru: "CANCELLED",
        message: `${profile.name} membatalkan peminjaman ${loan.nomorPeminjaman}.`,
      },
    }),
  ]);

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/peminjaman");
}
