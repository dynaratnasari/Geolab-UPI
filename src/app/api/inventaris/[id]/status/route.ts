import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Lightweight polling endpoint for the loan form's cart — current aggregate availability of a Tipe 1 item. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { jumlahTersedia: true },
  });

  return NextResponse.json({ jumlahTersedia: item?.jumlahTersedia ?? 0 });
}
