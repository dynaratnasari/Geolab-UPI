-- CreateEnum
CREATE TYPE "KategoriPengguna" AS ENUM ('MAHASISWA', 'DOSEN', 'UMUM');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "alamatInstansi" TEXT,
ADD COLUMN     "kategoriPengguna" "KategoriPengguna",
ADD COLUMN     "ktpUrl" TEXT,
ADD COLUMN     "nidn" TEXT;
