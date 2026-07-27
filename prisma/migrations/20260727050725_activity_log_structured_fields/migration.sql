-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'KETERLAMBATAN';

-- AlterTable
ALTER TABLE "activity_logs"
  ADD COLUMN "role" "Role",
  ADD COLUMN "loanId" TEXT,
  ADD COLUMN "statusLama" "LoanStatus",
  ADD COLUMN "statusBaru" "LoanStatus",
  ADD COLUMN "catatan" TEXT;

CREATE INDEX "activity_logs_loanId_idx" ON "activity_logs"("loanId");

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_loanId_fkey"
  FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
