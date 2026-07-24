import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PenggunaClient } from "@/components/pengguna/pengguna-client";

export default async function PenggunaPage() {
  await requireRole("KEPALA_LAB");
  const [profiles, dosenList] = await Promise.all([
    prisma.profile.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }),
    prisma.profile.findMany({ where: { role: "DOSEN" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Pengguna</h1>
        <p className="text-sm text-muted-foreground">Kelola akun dan peran pengguna GeoLab UPI.</p>
      </div>
      <PenggunaClient profiles={profiles} dosenList={dosenList} />
    </div>
  );
}
