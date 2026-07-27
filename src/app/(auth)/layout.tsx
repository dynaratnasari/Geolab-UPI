import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-upi-900 via-upi-800 to-upi-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-upi-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-merah-700/25 blur-3xl"
        />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>

        <div className="relative">
          <div className="flex w-fit items-center gap-3 rounded-xl bg-white px-4 py-2.5">
            <Image src="/logo-geolab.png" alt="Lab Geografi UPI" width={130} height={91} className="h-10 w-auto object-contain" />
            <div className="h-7 w-px bg-border" />
            <Image src="/logo-upi.jpg" alt="UPI" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">GeoLab UPI</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Sistem Informasi Peminjaman Alat dan Inventaris Geolab UPI — Laboratorium Geografi, Universitas
            Pendidikan Indonesia.
          </p>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Laboratorium Geografi UPI</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm animate-fade-up space-y-6">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex items-center gap-3">
              <Image src="/logo-geolab.png" alt="Lab Geografi UPI" width={130} height={91} className="h-10 w-auto object-contain" />
              <div className="h-7 w-px bg-border" />
              <Image
                src="/logo-upi.jpg"
                alt="Universitas Pendidikan Indonesia"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
              />
            </div>
            <p className="text-xs text-muted-foreground">Sistem Informasi Peminjaman Alat dan Inventaris Geolab UPI</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
