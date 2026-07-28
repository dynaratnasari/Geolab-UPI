"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInisialNama } from "@/lib/utils/kode-alat";
import {
  alatSchema,
  matkulSchema,
  dosenSchema,
  type AlatInput,
  type MatkulInput,
  type DosenInput,
} from "@/lib/validations/kelola-data";

const KELOLA_PATHS = ["/kelola-data", "/database-alat", "/jadwal", "/dashboard", "/peminjaman/ajukan"];

function revalidateAll() {
  for (const p of KELOLA_PATHS) revalidatePath(p);
}

// ---------- Alat ----------

/** Next free `{INISIAL}-GL-{seq}` code for a new item — scans existing codes with the same
 *  initials so renames/deletes never cause a collision. */
async function nextKodeInventaris(nama: string) {
  const inisial = getInisialNama(nama);
  const existing = await prisma.inventoryItem.findMany({
    where: { kodeInventaris: { startsWith: `${inisial}-GL-` } },
    select: { kodeInventaris: true },
  });
  const maxSeq = existing.reduce((max, i) => {
    const seq = parseInt(i.kodeInventaris.split("-")[2] ?? "0", 10);
    return Number.isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${inisial}-GL-${String(maxSeq + 1).padStart(2, "0")}`;
}

export async function createAlat(input: AlatInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = alatSchema.parse(input);

  const kodeInventaris = await nextKodeInventaris(data.nama);
  const item = await prisma.inventoryItem.create({
    data: {
      nama: data.nama,
      kodeInventaris,
      kodeQr: `QR-${kodeInventaris}`,
      categoryId: data.categoryId,
      merk: data.merk || null,
      spesifikasi: data.spesifikasi || null,
      jumlahTotal: data.jumlahTotal,
      jumlahTersedia: data.jumlahTotal,
      locationId: data.locationId || null,
      tipeAlat: data.tipeAlat,
      deskripsi: data.deskripsi || null,
    },
  });

  if (data.tipeAlat !== "TIPE_1") {
    await prisma.inventoryUnit.createMany({
      data: Array.from({ length: data.jumlahTotal }, (_, i) => {
        const suffix = String(i + 1).padStart(2, "0");
        return {
          itemId: item.id,
          kodeUnit: `${kodeInventaris}-${suffix}`,
          kodeQr: `QR-${kodeInventaris}-${suffix}`,
          locationId: data.locationId || null,
        };
      }),
    });
  }

  await prisma.activityLog.create({
    data: { type: "BARANG_MASUK", message: `Alat baru "${data.nama}" (${kodeInventaris}) ditambahkan.` },
  });

  revalidateAll();
  return { id: item.id, kodeInventaris };
}

export async function updateAlat(itemId: string, input: AlatInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = alatSchema.parse(input);

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId }, include: { units: true } });
  if (!item) throw new Error("Alat tidak ditemukan.");

  // jumlahTotal edits re-derive jumlahTersedia from the delta so active loans stay consistent;
  // shrinking below what's currently out on loan is rejected.
  const delta = data.jumlahTotal - item.jumlahTotal;
  const newTersedia = item.jumlahTersedia + delta;
  if (newTersedia < 0) {
    throw new Error("Jumlah total baru lebih kecil dari jumlah yang sedang dipinjam/rusak. Proses pengembalian dulu.");
  }

  // Renaming kodeInventaris cascades to every existing unit's kodeUnit/kodeQr so they keep
  // matching the `{kodeInventaris}-{seq}` scheme this item was created with.
  const newKode = data.kodeInventaris?.trim();
  let kodeInventaris = item.kodeInventaris;
  let kodeQr = item.kodeQr;
  const unitRenames: { id: string; kodeUnit: string; kodeQr: string }[] = [];
  if (newKode && newKode !== item.kodeInventaris) {
    const dup = await prisma.inventoryItem.findUnique({ where: { kodeInventaris: newKode } });
    if (dup) throw new Error(`Kode alat "${newKode}" sudah dipakai oleh "${dup.nama}".`);
    kodeInventaris = newKode;
    kodeQr = `QR-${newKode}`;
    for (const u of item.units) {
      const suffix = u.kodeUnit.slice(item.kodeInventaris.length);
      unitRenames.push({ id: u.id, kodeUnit: `${newKode}${suffix}`, kodeQr: `QR-${newKode}${suffix}` });
    }
  }

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      nama: data.nama,
      kodeInventaris,
      kodeQr,
      categoryId: data.categoryId,
      merk: data.merk || null,
      spesifikasi: data.spesifikasi || null,
      jumlahTotal: data.jumlahTotal,
      jumlahTersedia: newTersedia,
      locationId: data.locationId || null,
      tipeAlat: data.tipeAlat,
      deskripsi: data.deskripsi || null,
    },
  });

  for (const u of unitRenames) {
    await prisma.inventoryUnit.update({ where: { id: u.id }, data: { kodeUnit: u.kodeUnit, kodeQr: u.kodeQr } });
  }

  // Serialized items: backfill extra units when jumlahTotal grew (never auto-delete on shrink —
  // that's a manual decision since a specific physical unit has to be chosen).
  if (data.tipeAlat !== "TIPE_1" && item.units.length < data.jumlahTotal) {
    const maxSuffix = item.units.reduce((max, u) => {
      const seq = parseInt(u.kodeUnit.split("-").at(-1) ?? "0", 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
    await prisma.inventoryUnit.createMany({
      data: Array.from({ length: data.jumlahTotal - item.units.length }, (_, i) => {
        const suffix = String(maxSuffix + i + 1).padStart(2, "0");
        return {
          itemId,
          kodeUnit: `${kodeInventaris}-${suffix}`,
          kodeQr: `QR-${kodeInventaris}-${suffix}`,
          locationId: data.locationId || null,
        };
      }),
    });
  }

  revalidateAll();
}

export async function deleteAlat(itemId: string) {
  await requireRole("KEPALA_LAB", "LABORAN");

  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: { _count: { select: { loanItems: true, transactions: true } } },
  });
  if (!item) throw new Error("Alat tidak ditemukan.");
  if (item._count.loanItems > 0 || item._count.transactions > 0) {
    throw new Error(
      "Alat ini punya riwayat peminjaman/transaksi sehingga tidak bisa dihapus. Ubah statusnya menjadi nonaktif saja jika alat sudah tidak dipakai.",
    );
  }

  // Units/photos cascade via the schema; logs and histories are item-scoped and go with it.
  await prisma.maintenanceLog.deleteMany({ where: { itemId } });
  await prisma.locationHistory.deleteMany({ where: { itemId } });
  await prisma.inventoryItem.delete({ where: { id: itemId } });

  await prisma.activityLog.create({
    data: { type: "BARANG_KELUAR", message: `Alat "${item.nama}" (${item.kodeInventaris}) dihapus dari inventaris.` },
  });

  revalidateAll();
}

// ---------- Mata Kuliah ----------

export async function createMatkul(input: MatkulInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = matkulSchema.parse(input);

  const dup = await prisma.course.findUnique({ where: { kode: data.kode } });
  if (dup) throw new Error(`Kode mata kuliah "${data.kode}" sudah dipakai oleh "${dup.nama}".`);

  await prisma.course.create({ data });
  revalidateAll();
}

export async function updateMatkul(courseId: string, input: MatkulInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = matkulSchema.parse(input);

  const dup = await prisma.course.findUnique({ where: { kode: data.kode } });
  if (dup && dup.id !== courseId) throw new Error(`Kode mata kuliah "${data.kode}" sudah dipakai oleh "${dup.nama}".`);

  await prisma.course.update({ where: { id: courseId }, data });
  revalidateAll();
}

export async function deleteMatkul(courseId: string) {
  await requireRole("KEPALA_LAB", "LABORAN");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { schedules: true, loans: true } } },
  });
  if (!course) throw new Error("Mata kuliah tidak ditemukan.");
  if (course._count.schedules > 0 || course._count.loans > 0) {
    throw new Error("Mata kuliah ini masih dipakai oleh jadwal praktikum atau riwayat peminjaman, tidak bisa dihapus.");
  }

  await prisma.course.delete({ where: { id: courseId } });
  revalidateAll();
}

// ---------- Dosen ----------

/** Profile-only dosen entry (no login account) — same pattern as the seeder. The dosen appears in
 *  schedules, dosen-wali options, and auto-filled dosen pengampu without needing to sign in. */
export async function createDosen(input: DosenInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = dosenSchema.parse(input);

  const slug = data.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  let email = `${slug}@geolab.upi.edu`;
  if (await prisma.profile.findUnique({ where: { email } })) {
    email = `${slug}.${Date.now().toString(36)}@geolab.upi.edu`;
  }

  await prisma.profile.create({
    data: {
      id: randomUUID(),
      email,
      name: data.name,
      role: "DOSEN",
      nip: data.nip || null,
      nidn: data.nidn || null,
      prodi: data.prodi || null,
    },
  });

  revalidateAll();
}

export async function updateDosen(profileId: string, input: DosenInput) {
  await requireRole("KEPALA_LAB", "LABORAN");
  const data = dosenSchema.parse(input);

  const dosen = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!dosen || dosen.role !== "DOSEN") throw new Error("Dosen tidak ditemukan.");

  await prisma.profile.update({
    where: { id: profileId },
    data: { name: data.name, nip: data.nip || null, nidn: data.nidn || null, prodi: data.prodi || null },
  });

  revalidateAll();
}

export async function deleteDosen(profileId: string) {
  await requireRole("KEPALA_LAB", "LABORAN");

  const dosen = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { _count: { select: { schedulesAsDosen: true, approvals: true, mahasiswaBimbingan: true } } },
  });
  if (!dosen || dosen.role !== "DOSEN") throw new Error("Dosen tidak ditemukan.");
  if (dosen._count.schedulesAsDosen > 0) {
    throw new Error("Dosen ini masih terhubung ke jadwal praktikum. Ubah atau hapus jadwalnya dulu.");
  }
  if (dosen._count.mahasiswaBimbingan > 0) {
    throw new Error("Dosen ini masih menjadi dosen wali beberapa mahasiswa. Pindahkan dulu lewat Kelola Pengguna.");
  }
  if (dosen._count.approvals > 0) {
    throw new Error("Dosen ini punya riwayat approval sehingga tidak bisa dihapus.");
  }

  await prisma.profile.delete({ where: { id: profileId } });
  revalidateAll();
}
