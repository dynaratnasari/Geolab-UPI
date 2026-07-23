-- CreateEnum
CREATE TYPE "Role" AS ENUM ('KEPALA_LAB', 'DOSEN', 'LABORAN', 'MAHASISWA');

-- CreateEnum
CREATE TYPE "Kondisi" AS ENUM ('BERFUNGSI', 'PERLU_VERIFIKASI', 'MAINTENANCE', 'RUSAK', 'HILANG');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('MENUNGGU_DOSEN', 'MENUNGGU_KEPALA_LAB', 'DISETUJUI', 'DITOLAK', 'DIAMBIL', 'DIKEMBALIKAN', 'TERLAMBAT');

-- CreateEnum
CREATE TYPE "ApprovalLevel" AS ENUM ('DOSEN', 'KEPALA_LAB', 'LABORAN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_BARU', 'BARANG_KEMBALI', 'BARANG_TERLAMBAT', 'MAINTENANCE', 'PRAKTIKUM_HARI_INI', 'STOK_MENIPIS');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BARANG_DIPINJAM', 'BARANG_KEMBALI', 'APPROVAL', 'UPDATE_KONDISI', 'BARANG_MASUK', 'BARANG_KELUAR');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MAHASISWA',
    "nim" TEXT,
    "nip" TEXT,
    "prodi" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "gedung" TEXT NOT NULL,
    "ruangan" TEXT NOT NULL,
    "lemari" TEXT,
    "rak" TEXT,
    "posisi" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeInventaris" TEXT NOT NULL,
    "kodeQr" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "merk" TEXT,
    "spesifikasi" TEXT,
    "jumlahTotal" INTEGER NOT NULL DEFAULT 0,
    "jumlahTersedia" INTEGER NOT NULL DEFAULT 0,
    "jumlahDipinjam" INTEGER NOT NULL DEFAULT 0,
    "jumlahMaintenance" INTEGER NOT NULL DEFAULT 0,
    "jumlahRusak" INTEGER NOT NULL DEFAULT 0,
    "jumlahHilang" INTEGER NOT NULL DEFAULT 0,
    "locationId" TEXT,
    "tanggalPembelian" TIMESTAMP(3),
    "sumberDana" TEXT,
    "harga" DECIMAL(14,2),
    "status" "ItemStatus" NOT NULL DEFAULT 'AKTIF',
    "kondisi" "Kondisi" NOT NULL DEFAULT 'BERFUNGSI',
    "deskripsi" TEXT,
    "fotoUrl" TEXT,
    "manualBookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_photos" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catatan" TEXT NOT NULL,
    "kondisiBaru" "Kondisi" NOT NULL,
    "fotoUrl" TEXT,
    "byId" UUID,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_histories" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catatan" TEXT,
    "byId" UUID,

    CONSTRAINT "location_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" UUID,
    "mahasiswaId" UUID,
    "status" TEXT NOT NULL DEFAULT 'SELESAI',
    "catatan" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "prodi" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "dosenId" UUID,
    "locationId" TEXT,
    "ruanganLabel" TEXT,
    "kelas" TEXT,
    "angkatan" INTEGER,
    "jumlahMahasiswa" INTEGER,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'TERJADWAL',

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "nomorPeminjaman" TEXT NOT NULL,
    "mahasiswaId" UUID NOT NULL,
    "prodi" TEXT,
    "courseId" TEXT,
    "dosenPengampu" TEXT,
    "tanggalPinjam" TIMESTAMP(3) NOT NULL,
    "tanggalKembali" TIMESTAMP(3) NOT NULL,
    "jam" TEXT,
    "keperluan" TEXT NOT NULL,
    "suratUrl" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'MENUNGGU_DOSEN',
    "kuponUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_items" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,

    CONSTRAINT "loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "level" "ApprovalLevel" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'MENUNGGU',
    "byId" UUID,
    "catatan" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_records" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kondisiCheck" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "catatan" TEXT,

    CONSTRAINT "return_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nama_key" ON "categories"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "locations_gedung_ruangan_lemari_rak_posisi_key" ON "locations"("gedung", "ruangan", "lemari", "rak", "posisi");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_kodeInventaris_key" ON "inventory_items"("kodeInventaris");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_kodeQr_key" ON "inventory_items"("kodeQr");

-- CreateIndex
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");

-- CreateIndex
CREATE INDEX "inventory_items_locationId_idx" ON "inventory_items"("locationId");

-- CreateIndex
CREATE INDEX "inventory_items_kondisi_idx" ON "inventory_items"("kondisi");

-- CreateIndex
CREATE INDEX "inventory_photos_itemId_idx" ON "inventory_photos"("itemId");

-- CreateIndex
CREATE INDEX "maintenance_logs_itemId_idx" ON "maintenance_logs"("itemId");

-- CreateIndex
CREATE INDEX "location_histories_itemId_idx" ON "location_histories"("itemId");

-- CreateIndex
CREATE INDEX "transactions_itemId_idx" ON "transactions"("itemId");

-- CreateIndex
CREATE INDEX "transactions_tanggal_idx" ON "transactions"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "courses_kode_key" ON "courses"("kode");

-- CreateIndex
CREATE INDEX "schedules_hari_idx" ON "schedules"("hari");

-- CreateIndex
CREATE INDEX "schedules_courseId_idx" ON "schedules"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "loans_nomorPeminjaman_key" ON "loans"("nomorPeminjaman");

-- CreateIndex
CREATE INDEX "loans_mahasiswaId_idx" ON "loans"("mahasiswaId");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loan_items_loanId_idx" ON "loan_items"("loanId");

-- CreateIndex
CREATE INDEX "approvals_loanId_idx" ON "approvals"("loanId");

-- CreateIndex
CREATE INDEX "return_records_loanId_idx" ON "return_records"("loanId");

-- CreateIndex
CREATE INDEX "notifications_profileId_read_idx" ON "notifications"("profileId", "read");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_photos" ADD CONSTRAINT "inventory_photos_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_byId_fkey" FOREIGN KEY ("byId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_histories" ADD CONSTRAINT "location_histories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_histories" ADD CONSTRAINT "location_histories_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_histories" ADD CONSTRAINT "location_histories_byId_fkey" FOREIGN KEY ("byId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_byId_fkey" FOREIGN KEY ("byId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_records" ADD CONSTRAINT "return_records_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
