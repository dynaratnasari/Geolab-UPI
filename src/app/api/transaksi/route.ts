import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  await requireRole();

  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  const where: Prisma.TransactionWhereInput = {
    ...((from || to) && {
      tanggal: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(`${to}T23:59:59`) }),
      },
    }),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: { item: true, operator: true },
    orderBy: { tanggal: "desc" },
    take: 200,
  });

  const mahasiswaIds = transactions.map((t) => t.mahasiswaId).filter((id): id is string => !!id);
  const mahasiswaProfiles = mahasiswaIds.length
    ? await prisma.profile.findMany({ where: { id: { in: mahasiswaIds } } })
    : [];
  const mahasiswaMap = new Map(mahasiswaProfiles.map((p) => [p.id, p]));

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      tanggal: t.tanggal,
      itemNama: t.item.nama,
      jumlah: t.jumlah,
      operatorNama: t.operator?.name ?? "—",
      mahasiswaNama: t.mahasiswaId ? (mahasiswaMap.get(t.mahasiswaId)?.name ?? "—") : "—",
      status: t.status,
      catatan: t.catatan,
    })),
  });
}
