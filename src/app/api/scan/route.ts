import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  await requireRole("LABORAN", "KEPALA_LAB");

  const code = request.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Kode kosong" }, { status: 400 });
  }

  // The QR now encodes a full transaction URL (e.g. https://host/peminjaman/{id}) rather than
  // a bare code — pull the loan id straight out of the path when that's what was scanned.
  const pathMatch = code.match(/\/peminjaman\/([^/?#]+)/);
  if (pathMatch) {
    const loan = await prisma.loan.findUnique({
      where: { id: pathMatch[1] },
      select: { id: true, nomorPeminjaman: true, status: true, mahasiswa: { select: { name: true } } },
    });
    if (loan) {
      return NextResponse.json({
        type: "loan",
        id: loan.id,
        status: loan.status,
        label: `${loan.nomorPeminjaman} — ${loan.mahasiswa.name}`,
      });
    }
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  const item = await prisma.inventoryItem.findUnique({
    where: { kodeQr: code },
    select: { id: true, nama: true, kodeInventaris: true },
  });
  if (item) {
    return NextResponse.json({ type: "item", id: item.id, label: `${item.nama} (${item.kodeInventaris})` });
  }

  const unit = await prisma.inventoryUnit.findUnique({
    where: { kodeQr: code },
    select: { itemId: true, kodeUnit: true, item: { select: { nama: true } } },
  });
  if (unit) {
    return NextResponse.json({ type: "item", id: unit.itemId, label: `${unit.item.nama} (${unit.kodeUnit})` });
  }

  const loan = await prisma.loan.findUnique({
    where: { nomorPeminjaman: code },
    select: { id: true, nomorPeminjaman: true, status: true, mahasiswa: { select: { name: true } } },
  });
  if (loan) {
    return NextResponse.json({
      type: "loan",
      id: loan.id,
      status: loan.status,
      label: `${loan.nomorPeminjaman} — ${loan.mahasiswa.name}`,
    });
  }

  return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });
}
