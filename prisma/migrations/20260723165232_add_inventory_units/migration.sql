-- CreateEnum
CREATE TYPE "TipeAlat" AS ENUM ('TIPE_1', 'TIPE_2', 'TIPE_3');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('TERSEDIA', 'DIPINJAM', 'MAINTENANCE', 'RUSAK', 'HILANG');

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "tipeAlat" "TipeAlat" NOT NULL DEFAULT 'TIPE_1';

-- AlterTable
ALTER TABLE "loan_items" ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "inventory_units" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kodeUnit" TEXT NOT NULL,
    "kodeQr" TEXT NOT NULL,
    "kondisi" "Kondisi" NOT NULL DEFAULT 'BERFUNGSI',
    "status" "UnitStatus" NOT NULL DEFAULT 'TERSEDIA',
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_kodeUnit_key" ON "inventory_units"("kodeUnit");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_kodeQr_key" ON "inventory_units"("kodeQr");

-- CreateIndex
CREATE INDEX "inventory_units_itemId_idx" ON "inventory_units"("itemId");

-- CreateIndex
CREATE INDEX "inventory_units_status_idx" ON "inventory_units"("status");

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "inventory_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
