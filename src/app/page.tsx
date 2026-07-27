import Link from "next/link";
import { Boxes, ClipboardCheck, Activity, FileBarChart, QrCode, ArrowRight, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

// Landing numbers change rarely — prerender and refresh hourly.
export const revalidate = 3600;

const FEATURES = [
  {
    icon: Boxes,
    title: "Inventaris Digital",
    desc: "Seluruh alat laboratorium tercatat rapi dengan kode inventaris dan status kondisi yang selalu terbarui.",
  },
  {
    icon: QrCode,
    title: "QR Code per Alat",
    desc: "Setiap alat dan unit memiliki QR code sendiri sehingga mudah dilacak dan diverifikasi saat serah terima.",
  },
  {
    icon: ClipboardCheck,
    title: "Peminjaman Online",
    desc: "Mahasiswa mengajukan peminjaman dari mana saja, disetujui berjenjang oleh Laboran dan Kepala Lab.",
  },
  {
    icon: Activity,
    title: "Monitoring Realtime",
    desc: "Staf memantau alat yang sedang digunakan secara langsung — siapa peminjamnya dan untuk keperluan apa.",
  },
  {
    icon: FileBarChart,
    title: "Laporan Otomatis",
    desc: "Laporan inventaris, peminjaman, hingga keterlambatan tersusun otomatis dan siap diunduh.",
  },
  {
    icon: MapPin,
    title: "Lokasi Penyimpanan",
    desc: "Posisi setiap alat terpetakan per gedung dan ruangan sehingga mudah ditemukan kembali.",
  },
];

export default async function LandingPage() {
  const [totalAlat, totalKategori, totalMatkul, siteSetting] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.category.count(),
    prisma.course.count(),
    prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { heroImageUrl: true } }),
  ]);
  const heroImageUrl = siteSetting?.heroImageUrl ?? null;

  const stats = [
    { value: totalAlat, label: "Alat Laboratorium" },
    { value: totalKategori, label: "Kategori Alat" },
    { value: totalMatkul, label: "Mata Kuliah Terhubung" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Middleware redirects logged-in users away from "/", so this always renders logged-out. */}
      <PublicHeader isLoggedIn={false} activePath="/" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-upi-900 via-upi-800 to-upi-700 text-white">
        {heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          aria-hidden
          className={
            heroImageUrl
              ? "absolute inset-0 bg-gradient-to-br from-upi-900/90 via-upi-800/85 to-upi-700/80"
              : "absolute inset-0"
          }
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-upi-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-merah-700/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="max-w-2xl">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
              Laboratorium Geografi · Universitas Pendidikan Indonesia
            </p>
            <h1
              className="animate-fade-up mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              GeoLab UPI
              <span className="mt-2 block text-xl font-semibold text-white/80 md:text-2xl">
                Sistem Informasi Peminjaman Alat dan Inventaris Geolab UPI
              </span>
            </h1>
            <p
              className="animate-fade-up mt-5 max-w-xl text-sm leading-relaxed text-white/70 md:text-base"
              style={{ animationDelay: "160ms" }}
            >
              Ajukan peminjaman alat, pantau ketersediaan secara realtime, dan kelola inventaris laboratorium dalam satu
              platform yang rapi, cepat, dan mudah digunakan.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-upi-800 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
              >
                Masuk ke Sistem
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Daftar sebagai Mahasiswa
              </Link>
            </div>
          </div>

          <dl className="animate-fade-up mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3" style={{ animationDelay: "320ms" }}>
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <dd className="text-3xl font-bold">{s.value}</dd>
                <dt className="mt-1 text-xs text-white/70">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Semua kebutuhan lab dalam satu sistem
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Dirancang untuk mahasiswa, dosen, dan pengelola laboratorium agar proses peminjaman alat berjalan tertib dan
            transparan.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-upi-50 text-upi-700 transition-colors duration-200 group-hover:bg-upi-700 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center md:px-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Siap meminjam alat untuk praktikum atau riset?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Masuk dengan akun Anda atau daftar sebagai mahasiswa untuk mulai mengajukan peminjaman.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-merah-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-merah-800"
          >
            Mulai Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
