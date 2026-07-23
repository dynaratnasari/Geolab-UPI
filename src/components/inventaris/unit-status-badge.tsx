import { cn } from "@/lib/utils";
import type { UnitStatus } from "@prisma/client";

const STYLE: Record<UnitStatus, string> = {
  TERSEDIA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DIPINJAM: "bg-upi-50 text-upi-700 ring-upi-200",
  MAINTENANCE: "bg-orange-50 text-orange-700 ring-orange-200",
  RUSAK: "bg-red-50 text-red-700 ring-red-200",
  HILANG: "bg-slate-100 text-slate-600 ring-slate-200",
};

const DOT: Record<UnitStatus, string> = {
  TERSEDIA: "bg-emerald-500",
  DIPINJAM: "bg-upi-600",
  MAINTENANCE: "bg-orange-500",
  RUSAK: "bg-red-500",
  HILANG: "bg-slate-400",
};

const LABEL: Record<UnitStatus, string> = {
  TERSEDIA: "Tersedia",
  DIPINJAM: "Sedang Dipinjam",
  MAINTENANCE: "Maintenance",
  RUSAK: "Rusak",
  HILANG: "Hilang",
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        STYLE[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {LABEL[status]}
    </span>
  );
}
