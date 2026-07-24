-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "angkatan" INTEGER,
ADD COLUMN     "asalInstansi" TEXT,
ADD COLUMN     "dosenWaliId" UUID;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
