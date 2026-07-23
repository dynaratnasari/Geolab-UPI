-- CreateEnum
CREATE TYPE "KeperluanType" AS ENUM ('PRAKTIKUM', 'RISET', 'LAINNYA');

-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "jenisKeperluan" "KeperluanType" NOT NULL DEFAULT 'LAINNYA',
ALTER COLUMN "keperluan" DROP NOT NULL;
