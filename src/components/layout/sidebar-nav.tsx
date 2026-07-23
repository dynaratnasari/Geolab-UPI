"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_CONFIG } from "./nav-config";
import type { Role } from "@prisma/client";

export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_CONFIG[role];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-upi-700">
          <MapPin className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-sidebar-foreground">GeoLab UPI</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const isActive = item.href && pathname.startsWith(item.href);
          const Icon = item.icon;

          if (!item.href) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Segera
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-upi-50 text-upi-700"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
