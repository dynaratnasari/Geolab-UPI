import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  await requireRole();

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ items: [], categories: [], locations: [], profiles: [], loans: [] });
  }

  const [items, categories, locations, profiles, loans] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: {
        OR: [
          { nama: { contains: q, mode: "insensitive" } },
          { kodeInventaris: { contains: q, mode: "insensitive" } },
          { merk: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nama: true, kodeInventaris: true },
      take: 5,
    }),
    prisma.category.findMany({
      where: { nama: { contains: q, mode: "insensitive" } },
      select: { id: true, nama: true },
      take: 5,
    }),
    prisma.location.findMany({
      where: {
        OR: [{ ruangan: { contains: q, mode: "insensitive" } }, { gedung: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, ruangan: true, gedung: true },
      take: 5,
    }),
    prisma.profile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nim: { contains: q, mode: "insensitive" } },
          { nip: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, role: true, nim: true },
      take: 5,
    }),
    prisma.loan.findMany({
      where: { nomorPeminjaman: { contains: q, mode: "insensitive" } },
      select: { id: true, nomorPeminjaman: true, status: true, mahasiswa: { select: { name: true } } },
      take: 5,
    }),
  ]);

  return NextResponse.json({ items, categories, locations, profiles, loans });
}
