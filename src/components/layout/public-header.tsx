import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PublicHeader({ isLoggedIn, activePath }: { isLoggedIn: boolean; activePath?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-geolab.png" alt="Lab Geografi UPI" width={120} height={84} className="h-8 w-auto object-contain" />
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Image src="/logo-upi.jpg" alt="UPI" width={28} height={28} className="hidden h-7 w-7 rounded-full object-cover sm:block" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/database-alat"
            className={cn(
              "hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted sm:block",
              activePath === "/database-alat" ? "text-upi-700" : "text-foreground",
            )}
          >
            Database Alat
          </Link>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-upi-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-upi-800"
            >
              Ke Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:block"
              >
                Daftar
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-upi-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-upi-800"
              >
                Masuk
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
