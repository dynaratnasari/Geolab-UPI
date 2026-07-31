import { cn } from "@/lib/utils";
import type { LoanStatus } from "@prisma/client";

const STYLE: Record<LoanStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-500 ring-slate-200",
  SUBMITTED: "bg-violet-50 text-violet-700 ring-violet-200",
  WAITING_LABORAN_APPROVAL: "bg-violet-50 text-violet-700 ring-violet-200",
  LABORAN_APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LABORAN_REJECTED: "bg-red-50 text-red-700 ring-red-200",
  WAITING_HEAD_APPROVAL: "bg-violet-50 text-violet-700 ring-violet-200",
  HEAD_APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  HEAD_REJECTED: "bg-red-50 text-red-700 ring-red-200",
  READY_FOR_PICKUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  BORROWED: "bg-upi-50 text-upi-700 ring-upi-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  RETURN_PENDING_INSPECTION: "bg-amber-50 text-amber-700 ring-amber-200",
  RETURNED: "bg-slate-100 text-slate-600 ring-slate-200",
  RETURNED_DAMAGED: "bg-orange-50 text-orange-700 ring-orange-200",
  RETURNED_LOST: "bg-red-50 text-red-700 ring-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const DOT: Record<LoanStatus, string> = {
  DRAFT: "bg-slate-400",
  SUBMITTED: "bg-violet-500",
  WAITING_LABORAN_APPROVAL: "bg-violet-500",
  LABORAN_APPROVED: "bg-emerald-500",
  LABORAN_REJECTED: "bg-red-500",
  WAITING_HEAD_APPROVAL: "bg-violet-500",
  HEAD_APPROVED: "bg-emerald-500",
  HEAD_REJECTED: "bg-red-500",
  READY_FOR_PICKUP: "bg-emerald-500",
  BORROWED: "bg-upi-500",
  OVERDUE: "bg-red-500",
  RETURN_PENDING_INSPECTION: "bg-amber-500",
  RETURNED: "bg-slate-400",
  RETURNED_DAMAGED: "bg-orange-500",
  RETURNED_LOST: "bg-red-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-slate-400",
};

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  WAITING_LABORAN_APPROVAL: "Menunggu Laboran",
  LABORAN_APPROVED: "Disetujui Laboran",
  LABORAN_REJECTED: "Ditolak Laboran",
  WAITING_HEAD_APPROVAL: "Menunggu Kepala Lab",
  HEAD_APPROVED: "Disetujui Kepala Lab",
  HEAD_REJECTED: "Ditolak Kepala Lab",
  READY_FOR_PICKUP: "Siap Diambil",
  BORROWED: "Sedang Dipinjam",
  OVERDUE: "Terlambat",
  RETURN_PENDING_INSPECTION: "Menunggu Pemeriksaan",
  RETURNED: "Sudah Dikembalikan",
  RETURNED_DAMAGED: "Sudah Dikembalikan (Rusak)",
  RETURNED_LOST: "Sudah Dikembalikan (Hilang)",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        STYLE[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {LOAN_STATUS_LABEL[status]}
    </span>
  );
}
