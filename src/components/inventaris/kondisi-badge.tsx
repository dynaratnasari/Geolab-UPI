import { cn } from "@/lib/utils";
import type { Kondisi } from "@prisma/client";

const STYLE: Record<Kondisi, string> = {
  BERFUNGSI: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PERLU_VERIFIKASI: "bg-amber-50 text-amber-700 ring-amber-200",
  MAINTENANCE: "bg-orange-50 text-orange-700 ring-orange-200",
  RUSAK: "bg-red-50 text-red-700 ring-red-200",
  HILANG: "bg-slate-100 text-slate-600 ring-slate-200",
};

const DOT: Record<Kondisi, string> = {
  BERFUNGSI: "bg-emerald-500",
  PERLU_VERIFIKASI: "bg-amber-500",
  MAINTENANCE: "bg-orange-500",
  RUSAK: "bg-red-500",
  HILANG: "bg-slate-400",
};

const LABEL: Record<Kondisi, string> = {
  BERFUNGSI: "Berfungsi",
  PERLU_VERIFIKASI: "Perlu Verifikasi",
  MAINTENANCE: "Maintenance",
  RUSAK: "Rusak",
  HILANG: "Hilang",
};

export function KondisiBadge({ kondisi }: { kondisi: Kondisi }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        STYLE[kondisi],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[kondisi])} />
      {LABEL[kondisi]}
    </span>
  );
}
