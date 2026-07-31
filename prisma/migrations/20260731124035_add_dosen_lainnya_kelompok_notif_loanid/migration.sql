-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "dosenPembimbingNama" TEXT,
ADD COLUMN     "kelompok" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "loanId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_loanId_idx" ON "notifications"("loanId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
