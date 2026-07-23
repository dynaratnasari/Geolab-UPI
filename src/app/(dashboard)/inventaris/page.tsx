import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventarisClient } from "@/components/inventaris/inventaris-client";

export default async function InventarisPage() {
  await requireRole();

  const [categories, locations] = await Promise.all([
    prisma.category.findMany({ orderBy: { nama: "asc" } }),
    prisma.location.findMany({ orderBy: { ruangan: "asc" } }),
  ]);

  return <InventarisClient categories={categories} locations={locations} />;
}
