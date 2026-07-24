"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/lib/actions/auth";
import { NAV_CONFIG } from "./nav-config";
import type { Profile } from "@prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function ProfileCard({ profile, dosenWaliName }: { profile: Profile; dosenWaliName?: string }) {
  const isMahasiswa = profile.role === "MAHASISWA";

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2.5 px-1">
        <Avatar className="h-9 w-9">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
          <AvatarFallback className="bg-upi-100 text-xs font-semibold text-upi-700">
            {initials(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{profile.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {isMahasiswa ? "NIM" : "NIK"} {(isMahasiswa ? profile.nim : profile.nip) ?? "—"}
          </p>
        </div>
      </div>

      <dl className="mt-2.5 space-y-1 text-xs">
        {isMahasiswa ? (
          <>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Prodi</dt>
              <dd className="truncate text-right text-sidebar-foreground">{profile.prodi ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Angkatan</dt>
              <dd className="text-sidebar-foreground">{profile.angkatan ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-muted-foreground">Dosen Wali</dt>
              <dd className="truncate text-right text-sidebar-foreground">{dosenWaliName ?? "—"}</dd>
            </div>
          </>
        ) : (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">Asal Instansi</dt>
            <dd className="truncate text-right text-sidebar-foreground">{profile.asalInstansi ?? "—"}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-muted-foreground">Alamat</dt>
          <dd className="truncate text-right text-sidebar-foreground">{profile.alamat ?? "—"}</dd>
        </div>
      </dl>

      <form action={logout} className="mt-2.5">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-destructive hover:underline"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </form>
    </div>
  );
}

export function SidebarNav({
  profile,
  dosenWaliName,
  onNavigate,
}: {
  profile: Profile;
  dosenWaliName?: string;
  onNavigate?: () => void;
}) {
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
      <ProfileCard profile={profile} dosenWaliName={dosenWaliName} />
    </div>
  );
}
