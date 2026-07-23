import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getLaporanData, LAPORAN_TYPES, type LaporanType } from "@/lib/queries/laporan";

export async function GET(request: NextRequest) {
  await requireRole("KEPALA_LAB");

  const type = request.nextUrl.searchParams.get("type") as LaporanType | null;
  if (!type || !LAPORAN_TYPES.some((t) => t.value === type)) {
    return NextResponse.json({ error: "Tipe laporan tidak valid" }, { status: 400 });
  }

  const data = await getLaporanData(type);
  return NextResponse.json(data);
}
