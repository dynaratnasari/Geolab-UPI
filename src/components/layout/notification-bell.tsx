"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Bell,
  ClipboardCheck,
  PackageCheck,
  AlarmClockOff,
  Wrench,
  CalendarClock,
  PackageMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@prisma/client";

const ICONS: Record<NotificationType, { icon: typeof Bell; tone: string }> = {
  APPROVAL_BARU: { icon: ClipboardCheck, tone: "text-violet-600 bg-violet-50" },
  BARANG_KEMBALI: { icon: PackageCheck, tone: "text-emerald-600 bg-emerald-50" },
  BARANG_TERLAMBAT: { icon: AlarmClockOff, tone: "text-red-600 bg-red-50" },
  MAINTENANCE: { icon: Wrench, tone: "text-orange-600 bg-orange-50" },
  PRAKTIKUM_HARI_INI: { icon: CalendarClock, tone: "text-upi-700 bg-upi-50" },
  STOK_MENIPIS: { icon: PackageMinus, tone: "text-orange-600 bg-orange-50" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Gagal memuat notifikasi");
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function handleItemClick(notif: Notification) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifikasi</p>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} className="text-xs font-medium text-upi-700 hover:underline">
              Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
          ) : (
            notifications.map((notif) => {
              const conf = ICONS[notif.type];
              const Icon = conf.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left last:border-0 hover:bg-accent",
                    !notif.read && "bg-upi-50/40",
                  )}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", conf.tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notif.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: localeId })}
                    </p>
                  </div>
                  {!notif.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-upi-600" />}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
