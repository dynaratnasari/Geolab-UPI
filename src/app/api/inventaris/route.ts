import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  await requireRole();

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const kategori = params.get("kategori");
  const kondisi = params.get("kondisi");
  const lokasi = params.get("lokasi");
  const sort = params.get("sort") ?? "nama-asc";
  const page = Math.max(1, Number(params.get("page") ?? "1"));

  const where: Prisma.InventoryItemWhereInput = {
    ...(q && {
      OR: [
        { nama: { contains: q, mode: "insensitive" } },
        { kodeInventaris: { contains: q, mode: "insensitive" } },
        { merk: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(kategori && kategori !== "semua" && { categoryId: kategori }),
    ...(kondisi && kondisi !== "semua" && { kondisi: kondisi as Prisma.EnumKondisiFilter["equals"] }),
    ...(lokasi && lokasi !== "semua" && { locationId: lokasi }),
  };

  const [field, direction] = sort.split("-") as [string, "asc" | "desc"];
  const orderBy: Prisma.InventoryItemOrderByWithRelationInput =
    field === "jumlah" ? { jumlahTotal: direction } : field === "tahun" ? { tanggalPembelian: direction } : { nama: direction };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: { category: true, location: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
}
