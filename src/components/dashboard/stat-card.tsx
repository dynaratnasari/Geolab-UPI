import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; icon: string }> = {
  default: { bg: "bg-upi-50", icon: "text-upi-700" },
  success: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  warning: { bg: "bg-orange-50", icon: "text-orange-600" },
  danger: { bg: "bg-red-50", icon: "text-red-600" },
  info: { bg: "bg-violet-50", icon: "text-violet-600" },
  muted: { bg: "bg-slate-100", icon: "text-slate-500" },
};

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  const t = TONES[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.bg)}>
          <Icon className={cn("h-4.5 w-4.5", t.icon)} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
