import { cn } from "@/lib/utils";
import type { LoanStatus } from "@prisma/client";

const STYLE: Record<LoanStatus, string> = {
  MENUNGGU_DOSEN: "bg-violet-50 text-violet-700 ring-violet-200",
  MENUNGGU_KEPALA_LAB: "bg-violet-50 text-violet-700 ring-violet-200",
  DISETUJUI: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DITOLAK: "bg-red-50 text-red-700 ring-red-200",
  DIAMBIL: "bg-upi-50 text-upi-700 ring-upi-200",
  DIKEMBALIKAN: "bg-slate-100 text-slate-600 ring-slate-200",
  TERLAMBAT: "bg-orange-50 text-orange-700 ring-orange-200",
};

const DOT: Record<LoanStatus, string> = {
  MENUNGGU_DOSEN: "bg-violet-500",
  MENUNGGU_KEPALA_LAB: "bg-violet-500",
  DISETUJUI: "bg-emerald-500",
  DITOLAK: "bg-red-500",
  DIAMBIL: "bg-upi-500",
  DIKEMBALIKAN: "bg-slate-400",
  TERLAMBAT: "bg-orange-500",
};

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  MENUNGGU_DOSEN: "Menunggu Dosen",
  MENUNGGU_KEPALA_LAB: "Menunggu Kepala Lab",
  DISETUJUI: "Siap Diambil",
  DITOLAK: "Ditolak",
  DIAMBIL: "Sedang Dipinjam",
  DIKEMBALIKAN: "Dikembalikan",
  TERLAMBAT: "Terlambat",
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
