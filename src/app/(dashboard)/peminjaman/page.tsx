import Link from "next/link";
import { Plus, BookMarked } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function PeminjamanPage() {
  const profile = await requireRole("MAHASISWA");

  const loans = await prisma.loan.findMany({
    where: { mahasiswaId: profile.id },
    include: { course: true, items: { include: { item: true, unit: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Peminjaman</h1>
          <p className="text-sm text-muted-foreground">Ajukan peminjaman baru dan pantau status pengajuan Anda.</p>
        </div>
        <Button asChild className="bg-upi-700 hover:bg-upi-800">
          <Link href="/peminjaman/ajukan">
            <Plus className="h-4 w-4" />
            Ajukan Peminjaman
          </Link>
        </Button>
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-14 text-center shadow-soft">
          <BookMarked className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Anda belum pernah mengajukan peminjaman.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {loans.map((loan) => (
            <li key={loan.id}>
              <Link
                href={`/peminjaman/${loan.id}`}
                className="block rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
                    <p className="mt-0.5 font-medium text-foreground">
                      {loan.course?.nama ?? KEPERLUAN_LABEL[loan.jenisKeperluan]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {loan.items.map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : i.item.nama)).join(", ")}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatTanggal(loan.tanggalPinjam)} – {formatTanggal(loan.tanggalKembali)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
