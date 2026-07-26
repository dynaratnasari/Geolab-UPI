import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { DatabaseAlatClient } from "@/components/database-alat/database-alat-client";

export default async function DatabaseAlatPage() {
  const [profile, categories, items] = await Promise.all([
    getCurrentProfile(),
    prisma.category.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.inventoryItem.findMany({
      where: { status: "AKTIF" },
      orderBy: [{ category: { nama: "asc" } }, { nama: "asc" }],
      select: {
        id: true,
        nama: true,
        kodeInventaris: true,
        merk: true,
        jumlahTotal: true,
        jumlahTersedia: true,
        categoryId: true,
        category: { select: { nama: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader isLoggedIn={!!profile} activePath="/database-alat" />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Database Alat Laboratorium</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Daftar lengkap alat dan instrumen milik Laboratorium Geografi UPI beserta status ketersediaannya secara
            realtime.
          </p>
        </div>
        <div className="animate-fade-up mt-8" style={{ animationDelay: "80ms" }}>
          <DatabaseAlatClient items={items} categories={categories} />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
