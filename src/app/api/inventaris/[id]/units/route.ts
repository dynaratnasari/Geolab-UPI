import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;

  const units = await prisma.inventoryUnit.findMany({
    where: { itemId: id, status: "TERSEDIA" },
    orderBy: { kodeUnit: "asc" },
    select: { id: true, kodeUnit: true, kondisi: true },
  });

  return NextResponse.json({ units });
}
