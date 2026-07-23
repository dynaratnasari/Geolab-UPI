# GeoLab UPI — Monitoring Peminjaman dan Inventaris Laboratorium

Sistem manajemen inventaris dan peminjaman alat Laboratorium Geografi UPI (Program Studi Sains Informasi Geografi). Dibangun bertahap; dokumen ini mencakup **Fase 1**: Database Schema, ERD, Folder Structure, Authentication, Dashboard, Inventaris, dan Detail Barang.

## Tech Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS v4 · shadcn/ui (Radix) · Prisma ORM 6 · Supabase (Auth + Postgres) · TanStack Table & Query · Recharts · React Hook Form + Zod · qrcode

## Setup

### 1. Buat project Supabase (sekali saja)

1. Buka [supabase.com](https://supabase.com) → sign in → **New Project**.
2. Nama: `geolab-upi`, region **Southeast Asia (Singapore)**, catat password DB-nya.
3. Tunggu ~2 menit sampai selesai provisioning.
4. **Settings → API** → salin `Project URL`, `anon public` key, `service_role` key.
5. **Settings → Database → Connection string** → salin URI **Connection pooling** (untuk `DATABASE_URL`) dan URI **direct connection** (untuk `DIRECT_URL`).

### 2. Isi environment variables

Salin `.env.example` menjadi `.env.local` dan isi kelima nilai di atas.

### 3. Install, migrasi, seed

```bash
npm install
npx prisma migrate dev --name init
```

Setelah migrasi jalan, buka **Supabase SQL Editor** dan jalankan isi [`supabase/sql/001_handle_new_user.sql`](supabase/sql/001_handle_new_user.sql) satu kali — ini membuat trigger yang otomatis membuat baris `profiles` saat ada pendaftaran mahasiswa baru.

```bash
npm run db:seed
```

Seed akan membuat 4 akun demo (satu per role), 160 alat inventaris nyata, 20 mata kuliah + 38 jadwal praktikum nyata dari data lab. Lihat [`prisma/seed-data/users.ts`](prisma/seed-data/users.ts) untuk daftar email demo — semua memakai password `GeoLabUPI2026!`.

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke `/login`.

## Sumber Data

Data seed diambil dari dokumen resmi lab, bukan data contoh:

- `~/Documents/PROJECT/WEB AI - GEOLAB/Daftar Alat Inventaris Geolab/*.pdf` — daftar inventaris alat.
- `~/Documents/PROJECT/WEB AI - GEOLAB/Mata Kuliah dan Dosen Pengampu/S1 Pend Geo_Jadwal Smt Ganjil 2025 - 2026.xlsx` — jadwal & mata kuliah.

## Struktur Folder

```
prisma/
  schema.prisma        # skema database (17 model, mencakup semua 15 tahap)
  seed.ts               # entry point seeding
  seed-data/            # data nyata yang ditranskripsi (inventaris, lokasi, mata kuliah, jadwal, users)
src/
  app/(auth)/           # login, register (mahasiswa)
  app/(dashboard)/      # layout ber-sidebar, dashboard, inventaris, detail barang
  app/api/              # route handler (mis. /api/inventaris untuk search/filter/pagination)
  components/
    ui/                 # primitif shadcn/ui
    dashboard/          # stat card, chart, activity feed, jadwal list
    inventaris/         # tabel/grid, badge kondisi
    layout/              # sidebar, topbar, konfigurasi navigasi per role
  lib/
    supabase/           # client browser, client server, middleware session
    auth.ts             # getCurrentProfile, requireRole, label role
    prisma.ts           # Prisma client singleton
    queries/            # query dashboard
    actions/            # server actions (mis. logout)
docs/ERD.md             # diagram ERD (Mermaid)
supabase/sql/           # SQL yang dijalankan manual di Supabase (trigger auth)
```

## Roadmap (belum dibangun)

Lokasi Penyimpanan (visual), Peminjaman + approval bertingkat + kupon PDF, Barang Masuk/Keluar, Jadwal Praktikum (calendar view), Laporan (PDF/Excel), Notifikasi realtime, Pencarian global, polish responsive, testing.
