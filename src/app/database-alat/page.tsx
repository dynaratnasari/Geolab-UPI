import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { DatabaseAlatClient, type AlatRow } from "@/components/database-alat/database-alat-client";

export default async function DatabaseAlatPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [profile, categories, rawItems] = await Promise.all([
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
        tipeAlat: true,
        jumlahTotal: true,
        jumlahTersedia: true,
        categoryId: true,
        fotoUrl: true,
        category: { select: { nama: true } },
        units: { select: { id: true, kodeUnit: true, status: true }, orderBy: { kodeUnit: "asc" } },
      },
    }),
  ]);

  // Tipe 1 (risiko rendah) tetap satu baris gabungan dengan hitungan stok — jumlahnya
  // banyak dan tidak butuh pelacakan per unit. Tipe 2/3 (risiko sedang/tinggi) sudah
  // punya InventoryUnit individual (lihat halaman Inventaris), jadi setiap unit fisik
  // tampil sebagai baris sendiri dengan kodeUnit-nya sendiri, bukan digabung jadi satu
  // baris stok.
  const items: AlatRow[] = rawItems.flatMap((item): AlatRow[] =>
    item.tipeAlat === "TIPE_1" || item.units.length === 0
      ? [
          {
            kind: "aggregate" as const,
            id: item.id,
            kode: item.kodeInventaris,
            nama: item.nama,
            merk: item.merk,
            categoryId: item.categoryId,
            categoryNama: item.category.nama,
            jumlahTotal: item.jumlahTotal,
            jumlahTersedia: item.jumlahTersedia,
            fotoUrl: item.fotoUrl,
          },
        ]
      : item.units.map((u) => ({
          kind: "unit" as const,
          id: u.id,
          itemId: item.id,
          kode: u.kodeUnit,
          nama: item.nama,
          merk: item.merk,
          categoryId: item.categoryId,
          categoryNama: item.category.nama,
          status: u.status,
          fotoUrl: item.fotoUrl,
        })),
  );

  // Logged-in users (mahasiswa/staff) see this inside the usual sidebar shell;
  // logged-out "umum" visitors see it with the public marketing header/footer.
  if (profile) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar profile={profile} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar profile={profile} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Database Alat Laboratorium</h1>
                <p className="text-sm text-muted-foreground">
                  Daftar lengkap alat dan instrumen milik Laboratorium Geografi UPI beserta status ketersediaannya
                  secara realtime.
                </p>
              </div>
              <DatabaseAlatClient items={items} categories={categories} initialCategory={kategori} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader isLoggedIn={false} activePath="/database-alat" />
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
