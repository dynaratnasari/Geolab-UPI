"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { NAV_CONFIG } from "./nav-config";
import type { Profile } from "@prisma/client";

const linkClass = (isActive: boolean) =>
  cn(
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-upi-50 text-upi-700"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

export function SidebarNav({ profile, onNavigate }: { profile: Profile; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_CONFIG[profile.role];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border p-4">
        <Image src="/logo-geolab.png" alt="Lab Geografi UPI" width={120} height={84} className="h-8 w-auto object-contain" />
        <Image
          src="/logo-upi.jpg"
          alt="UPI"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-sidebar-border"
        />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <Link href="/profil" onClick={onNavigate} className={linkClass(pathname.startsWith("/profil"))}>
          <UserCircle className="h-4 w-4" />
          Profil Saya
        </Link>
        <div className="my-1 border-t border-sidebar-border" />

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
            <Link key={item.label} href={item.href} onClick={onNavigate} className={linkClass(!!isActive)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-destructive hover:underline"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
