import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KelolaDataClient } from "@/components/kelola-data/kelola-data-client";

export default async function KelolaDataPage() {
  await requireRole("KEPALA_LAB", "LABORAN");

  const [items, courses, dosen, categories, locations, siteSetting] = await Promise.all([
    prisma.inventoryItem.findMany({
      orderBy: { nama: "asc" },
      // Explicit select keeps the payload client-serializable (harga is a Decimal) and small.
      select: {
        id: true,
        nama: true,
        kodeInventaris: true,
        merk: true,
        spesifikasi: true,
        jumlahTotal: true,
        jumlahTersedia: true,
        tipeAlat: true,
        deskripsi: true,
        categoryId: true,
        locationId: true,
        category: { select: { nama: true } },
        location: { select: { ruangan: true } },
      },
    }),
    prisma.course.findMany({ orderBy: { nama: "asc" } }),
    prisma.profile.findMany({
      where: { role: "DOSEN" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nip: true, nidn: true, prodi: true },
    }),
    prisma.category.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.location.findMany({ orderBy: [{ gedung: "asc" }, { ruangan: "asc" }], select: { id: true, ruangan: true, gedung: true } }),
    prisma.siteSetting.findUnique({ where: { id: "singleton" }, select: { heroImageUrl: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Data</h1>
        <p className="text-sm text-muted-foreground">
          Tambah, ubah, atau hapus data alat, mata kuliah, dan dosen.
        </p>
      </div>
      <KelolaDataClient
        items={items}
        courses={courses}
        dosen={dosen}
        categories={categories}
        locations={locations}
        heroImageUrl={siteSetting?.heroImageUrl ?? null}
      />
    </div>
  );
}
