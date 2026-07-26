import { cn } from "@/lib/utils";

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        available
          ? "bg-status-tersedia/10 text-status-tersedia ring-status-tersedia/25"
          : "bg-status-rusak/10 text-status-rusak ring-status-rusak/25",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", available ? "bg-status-tersedia" : "bg-status-rusak")} />
      {available ? "Tersedia" : "Habis"}
    </span>
  );
}
