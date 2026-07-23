import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ClipboardCheck, PackageCheck, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { ActivityLog, Profile } from "@prisma/client";
import { cn } from "@/lib/utils";

const ICONS = {
  BARANG_DIPINJAM: { icon: PackageCheck, tone: "text-upi-700 bg-upi-50" },
  BARANG_KEMBALI: { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  APPROVAL: { icon: ClipboardCheck, tone: "text-violet-600 bg-violet-50" },
  UPDATE_KONDISI: { icon: Wrench, tone: "text-orange-600 bg-orange-50" },
  BARANG_MASUK: { icon: ArrowDownToLine, tone: "text-emerald-600 bg-emerald-50" },
  BARANG_KELUAR: { icon: ArrowUpFromLine, tone: "text-upi-700 bg-upi-50" },
} as const;

type ActivityWithActor = ActivityLog & { actor: Profile | null };

export function ActivityFeed({ activities }: { activities: ActivityWithActor[] }) {
  if (activities.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => {
        const conf = ICONS[activity.type];
        const Icon = conf.icon;
        return (
          <li key={activity.id} className="flex gap-3">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", conf.tone)}>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground">
                {activity.actor ? `${activity.actor.name} · ` : ""}
                {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: localeId })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
