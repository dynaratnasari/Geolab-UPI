import { PrismaClient, Kondisi } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { CATEGORIES } from "./seed-data/kategori";
import { LOCATIONS } from "./seed-data/lokasi";
import { INVENTARIS } from "./seed-data/inventaris";
import { COURSES } from "./seed-data/matakuliah";
import { DOSEN, SCHEDULES } from "./seed-data/jadwal";
import { DEMO_USERS, DEMO_PASSWORD } from "./seed-data/users";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

/** Creates the Supabase Auth user if needed, or returns the existing one by email. */
async function getOrCreateAuthUser(email: string, name: string) {
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (created.data.user) return created.data.user;

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const existing = data.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Failed to create or find auth user for ${email}: ${created.error?.message}`);
  return existing;
}

async function seedCategories() {
  const map = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { nama: c.nama },
      update: { icon: c.icon },
      create: { nama: c.nama, icon: c.icon },
    });
    map.set(c.nama, row.id);
  }
  return map;
}

async function seedLocations() {
  const map = new Map<string, string>();
  for (const l of LOCATIONS) {
    const existing = await prisma.location.findFirst({ where: { ruangan: l.ruangan, gedung: l.gedung } });
    const row =
      existing ??
      (await prisma.location.create({
        data: { gedung: l.gedung, ruangan: l.ruangan, lemari: l.lemari, rak: l.rak },
      }));
    map.set(l.ruangan, row.id);
  }
  return map;
}

async function seedCourses() {
  const map = new Map<string, string>();
  for (const c of COURSES) {
    const row = await prisma.course.upsert({
      where: { kode: c.kode },
      update: { nama: c.nama, sks: c.sks, prodi: c.prodi, menggunakanLab: c.menggunakanLab },
      create: c,
    });
    map.set(c.kode, row.id);
  }
  return map;
}

/** Demo login accounts (real Supabase Auth users) — one per role. */
async function seedDemoUsers() {
  const map = new Map<string, string>(); // name -> profile id
  for (const u of DEMO_USERS) {
    const authUser = await getOrCreateAuthUser(u.email, u.name);
    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: { name: u.name, role: u.role, nip: u.nip, nim: u.nim, prodi: u.prodi, email: u.email },
      create: { id: authUser.id, email: u.email, name: u.name, role: u.role, nip: u.nip, nim: u.nim, prodi: u.prodi },
    });
    map.set(u.name, authUser.id);
  }
  return map;
}

/** Remaining lecturers from the schedule that aren't already a demo login — profile-only,
 *  no Supabase Auth account (can't log in yet, but show up correctly as dosen pengampu). */
async function seedLecturerProfiles(existing: Map<string, string>) {
  for (const name of DOSEN) {
    if (existing.has(name)) continue;
    const id = randomUUID();
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@geolab.upi.edu`;
    const row = await prisma.profile.upsert({
      where: { email },
      update: { name, role: "DOSEN", prodi: "S1 Pendidikan Geografi" },
      create: { id, email, name, role: "DOSEN", prodi: "S1 Pendidikan Geografi" },
    });
    existing.set(name, row.id);
  }
  return existing;
}

async function seedInventaris(categoryMap: Map<string, string>, locationMap: Map<string, string>) {
  const ids: string[] = [];
  for (let i = 0; i < INVENTARIS.length; i++) {
    const item = INVENTARIS[i];
    const kodeInventaris = `GL-${pad(i + 1, 3)}`;
    const kodeQr = `QR-${kodeInventaris}`;
    const kondisi: Kondisi = (item.kondisi as Kondisi) ?? Kondisi.BERFUNGSI;

    let jumlahMaintenance = 0;
    let jumlahRusak = 0;
    let jumlahHilang = 0;
    if (kondisi === Kondisi.MAINTENANCE) jumlahMaintenance = Math.min(1, item.jumlah);
    if (kondisi === Kondisi.RUSAK) jumlahRusak = item.jumlah <= 2 ? item.jumlah : 1;
    if (kondisi === Kondisi.HILANG) jumlahHilang = Math.min(1, item.jumlah);
    const jumlahTersedia = item.jumlah - jumlahMaintenance - jumlahRusak - jumlahHilang;

    const row = await prisma.inventoryItem.upsert({
      where: { kodeInventaris },
      update: {},
      create: {
        nama: item.nama,
        kodeInventaris,
        kodeQr,
        categoryId: categoryMap.get(item.kategori)!,
        merk: item.merk,
        jumlahTotal: item.jumlah,
        jumlahTersedia,
        jumlahDipinjam: 0,
        jumlahMaintenance,
        jumlahRusak,
        jumlahHilang,
        locationId: locationMap.get(item.lokasi),
        tanggalPembelian: item.tahun ? new Date(`${item.tahun}-01-15`) : null,
        sumberDana: item.dana,
        kondisi,
        deskripsi: item.deskripsi,
      },
    });
    ids.push(row.id);

    if (kondisi !== Kondisi.BERFUNGSI) {
      await prisma.maintenanceLog.create({
        data: {
          itemId: row.id,
          catatan: `Status ditinjau sebagai ${kondisi} saat audit inventaris.`,
          kondisiBaru: kondisi,
        },
      });
      await prisma.activityLog.create({
        data: {
          type: "UPDATE_KONDISI",
          message: `Kondisi "${item.nama}" (${kodeInventaris}) diperbarui menjadi ${kondisi}.`,
        },
      });
    }
  }
  return ids;
}

async function seedSchedules(courseMap: Map<string, string>, lecturerMap: Map<string, string>) {
  for (const s of SCHEDULES) {
    const courseId = courseMap.get(s.kodeMk);
    if (!courseId) continue;
    await prisma.schedule.create({
      data: {
        hari: s.hari,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
        courseId,
        dosenId: lecturerMap.get(s.dosenUtama),
        ruanganLabel: s.ruanganLabel,
        kelas: s.kelas,
        angkatan: s.angkatan,
        status: "TERJADWAL",
      },
    });
  }
}

async function seedActivityLog() {
  const recentItems = await prisma.inventoryItem.findMany({
    orderBy: { tanggalPembelian: "desc" },
    take: 5,
  });
  for (const item of recentItems) {
    await prisma.activityLog.create({
      data: {
        type: "BARANG_MASUK",
        message: `"${item.nama}" (${item.kodeInventaris}) ditambahkan ke inventaris.`,
        createdAt: item.tanggalPembelian ?? new Date(),
      },
    });
  }
}

async function main() {
  console.log("Seeding categories...");
  const categoryMap = await seedCategories();

  console.log("Seeding locations...");
  const locationMap = await seedLocations();

  console.log("Seeding courses...");
  const courseMap = await seedCourses();

  console.log("Seeding demo login accounts (Supabase Auth)...");
  const profileMap = await seedDemoUsers();

  console.log("Seeding remaining lecturer profiles...");
  const lecturerMap = await seedLecturerProfiles(profileMap);

  console.log(`Seeding ${INVENTARIS.length} inventory items...`);
  await seedInventaris(categoryMap, locationMap);

  console.log(`Seeding ${SCHEDULES.length} schedules...`);
  await seedSchedules(courseMap, lecturerMap);

  console.log("Seeding activity log...");
  await seedActivityLog();

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
