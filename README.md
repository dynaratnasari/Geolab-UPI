# GeoLab UPI — Sistem Informasi Peminjaman Alat dan Inventaris

Sistem manajemen inventaris dan peminjaman alat Laboratorium Geografi UPI (Program Studi Sains Informasi Geografi), untuk empat peran: Mahasiswa, Dosen Penanggung Jawab, Laboran, dan Kepala Laboratorium.

## Tech Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS v4 · shadcn/ui (Radix) · Prisma ORM 6 · Supabase (Auth + Postgres + Storage) · TanStack Table & Query · Recharts · React Hook Form + Zod · `qrcode` (buat QR) · `jsqr` (scan QR dari kamera) · `jspdf` (kupon peminjaman PDF)

## Setup

### 1. Buat project Supabase (sekali saja)

1. Buka [supabase.com](https://supabase.com) → sign in → **New Project**.
2. Nama: `geolab-upi`, region **Southeast Asia (Singapore)**, catat password DB-nya.
3. Tunggu ~2 menit sampai selesai provisioning.
4. **Settings → API** → salin `Project URL`, `anon public` key, `service_role` key.
5. **Settings → Database → Connection string** → salin URI **Connection pooling** (untuk `DATABASE_URL`) dan URI **direct connection** (untuk `DIRECT_URL`).
6. **Storage** → buat 4 bucket public: `avatars`, `peminjaman`, `site`, dan 1 bucket privat `documents` (untuk KTP — akses dibatasi lewat RLS policy per pemilik + Kepala Lab).

### 2. Isi environment variables

Salin `.env.example` menjadi `.env` dan isi kelima nilai di atas.

### 3. Install, migrasi, seed

```bash
npm install
npx prisma migrate deploy
```

Setelah migrasi jalan, buka **Supabase SQL Editor** dan jalankan isi [`supabase/sql/001_handle_new_user.sql`](supabase/sql/001_handle_new_user.sql) satu kali — ini membuat trigger yang otomatis membuat baris `profiles` saat ada pendaftaran mahasiswa baru.

```bash
npm run db:seed
```

Seed akan membuat akun demo per role, ~160 alat inventaris nyata, mata kuliah + jadwal praktikum nyata dari data lab. Lihat [`prisma/seed-data/users.ts`](prisma/seed-data/users.ts) untuk daftar email demo.

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — halaman depan publik, `/login` untuk masuk.

## Sumber Data

Data seed diambil dari dokumen resmi lab, bukan data contoh:

- `~/Documents/PROJECT/WEB AI - GEOLAB/Daftar Alat Inventaris Geolab/*.pdf` — daftar inventaris alat.
- `~/Documents/PROJECT/WEB AI - GEOLAB/Mata Kuliah dan Dosen Pengampu/S1 Pend Geo_Jadwal Smt Ganjil 2025 - 2026.xlsx` — jadwal & mata kuliah.

## Fitur

- **Landing page publik** (`/`) dan **Database Alat** (`/database-alat`) — katalog instrumen yang bisa diakses tanpa login, dengan filter kategori dan status ketersediaan realtime.
- **Peminjaman** (Mahasiswa) — ajukan peminjaman (Praktikum / Riset / Kegiatan Lainnya), batalkan pengajuan sebelum diproses, lihat status dan kupon digital (QR code) per peminjaman.
- **Approval bertingkat** — Praktikum hanya perlu persetujuan Laboran; Riset/Kegiatan Lainnya lanjut ke persetujuan Kepala Lab. Alur ini adalah satu-satunya sumber status (*single source of truth*) — semua role membaca `Loan.status` yang sama, tidak ada halaman yang menghitung status sendiri.
- **Scan QR** (Laboran) — scan kupon mahasiswa untuk konfirmasi pengambilan barang, atau scan untuk memulai pemeriksaan pengembalian (kondisi 6 tingkat, catatan, foto).
- **Keterlambatan otomatis** — status berubah ke Terlambat begitu lewat jatuh tempo, badge merah, notifikasi ke Mahasiswa/Laboran/Kepala Lab, dan reminder di Dashboard.
- **Monitoring Live** & **Barang Masuk/Keluar** — pantau alat yang sedang dipinjam secara realtime dan riwayat transaksi stok.
- **Kelola Data** (Laboran/Kepala Lab) — CRUD alat, mata kuliah, dosen, dan foto hero halaman depan, tanpa perlu masuk ke database langsung.
- **Log Aktivitas** (Kepala Lab) — audit trail terstruktur (tanggal, jam, user, peran, status lama, status baru, catatan) untuk setiap perubahan status peminjaman.
- **Laporan, Statistik, Kelola Pengguna, Jadwal Praktikum, Lokasi Penyimpanan, Notifikasi, Pencarian global** — semua sudah berjalan.

## Struktur Folder

```
prisma/
  schema.prisma        # skema database (Loan/Approval/ReturnRecord/ActivityLog dll.)
  migrations/           # riwayat migrasi (hand-written untuk perubahan enum yang tidak trivial)
  seed.ts / seed-data/   # data nyata yang ditranskripsi (inventaris, lokasi, mata kuliah, jadwal, users)
src/
  app/(auth)/            # login, register (mahasiswa)
  app/(dashboard)/       # layout ber-sidebar per role — dashboard, inventaris, database-alat,
                         # peminjaman, approval, scan, monitoring-live, monitoring-mahasiswa,
                         # kelola-data, kelola pengguna, laporan, statistik, aktivitas, jadwal,
                         # lokasi, transaksi, profil
  app/database-alat/     # katalog alat publik (di luar shell dashboard, bisa diakses tanpa login)
  app/page.tsx           # landing page publik
  app/api/               # route handler (search, scan lookup, monitoring-live polling, dll.)
  components/
    ui/                  # primitif shadcn/ui
    dashboard/           # stat card, chart, activity feed, jadwal list
    peminjaman/          # form pengajuan, status badge, kupon, approval actions, form pengembalian
    scan/                # scanner QR (kamera + input manual)
    monitoring/          # dashboard monitoring live staf
    inventaris/          # tabel/grid, badge kondisi
    layout/              # sidebar, topbar, header/footer publik, konfigurasi navigasi per role
  lib/
    supabase/            # client browser, client server, middleware session
    auth.ts              # getCurrentProfile, requireRole, label role
    prisma.ts             # Prisma client singleton
    notify.ts             # fan-out notifikasi per role (mis. semua Laboran)
    queries/               # query per halaman (dashboard, peminjaman, laporan, statistik, dll.)
    actions/               # server actions (peminjaman, approval, handover, pengembalian, dll.)
docs/ERD.md              # diagram ERD (Mermaid)
supabase/sql/             # SQL yang dijalankan manual di Supabase (trigger auth)
```
