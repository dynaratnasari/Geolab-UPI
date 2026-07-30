-- AlterTable
ALTER TABLE "loans" ADD COLUMN "dosenPembimbingId" UUID,
ADD COLUMN "lokasi" TEXT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_dosenPembimbingId_fkey" FOREIGN KEY ("dosenPembimbingId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
