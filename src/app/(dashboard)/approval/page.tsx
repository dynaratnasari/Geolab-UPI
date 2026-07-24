import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalActions } from "@/components/peminjaman/approval-actions";
import { PengembalianForm } from "@/components/peminjaman/pengembalian-form";
import { KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";
import type { KeperluanType } from "@prisma/client";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(
    date,
  );
}

const loanInclude = { mahasiswa: true, course: true, items: { include: { item: true, unit: true } } } as const;

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-14 text-center shadow-soft">
      <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">Tidak ada pengajuan yang menunggu tindakan Anda.</p>
    </div>
  );
}

function LoanCard({
  loan,
  action,
}: {
  loan: {
    id: string;
    nomorPeminjaman: string;
    mahasiswa: { name: string };
    course: { nama: string } | null;
    items: { item: { nama: string }; unit: { kodeUnit: string } | null; jumlah: number }[];
    tanggalPinjam: Date;
    tanggalKembali: Date;
    jenisKeperluan: KeperluanType;
    keperluan: string | null;
  };
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
          <Link href={`/peminjaman/${loan.id}`} className="font-medium text-foreground hover:underline">
            {loan.mahasiswa.name}
          </Link>
          <p className="text-xs text-muted-foreground">{loan.course?.nama ?? "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {loan.items.map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : `${i.item.nama} (${i.jumlah})`)).join(", ")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTanggal(loan.tanggalPinjam)} – {formatTanggal(loan.tanggalKembali)}
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground">
            {KEPERLUAN_LABEL[loan.jenisKeperluan]}
            {loan.keperluan ? ` — "${loan.keperluan}"` : ""}
          </p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

export default async function ApprovalPage() {
  const profile = await requireRole("KEPALA_LAB", "LABORAN");

  if (profile.role === "KEPALA_LAB") {
    const loans = await prisma.loan.findMany({ where: { status: "MENUNGGU_KEPALA_LAB" }, include: loanInclude, orderBy: { createdAt: "asc" } });
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval Peminjaman</h1>
          <p className="text-sm text-muted-foreground">Pengajuan untuk kegiatan selain praktikum/riset, menunggu persetujuan Anda.</p>
        </div>
        {loans.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} action={<ApprovalActions loanId={loan.id} stage="KEPALA_LAB" />} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // LABORAN: serah terima (DISETUJUI) + pengembalian (DIAMBIL)
  const [siapDiserahkan, sedangDipinjam] = await Promise.all([
    prisma.loan.findMany({ where: { status: "DISETUJUI" }, include: loanInclude, orderBy: { createdAt: "asc" } }),
    prisma.loan.findMany({ where: { status: "DIAMBIL" }, include: loanInclude, orderBy: { tanggalKembali: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval & Serah Terima</h1>
        <p className="text-sm text-muted-foreground">Serahkan barang yang telah disetujui dan proses pengembalian.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Siap Diserahkan ({siapDiserahkan.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {siapDiserahkan.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada barang yang perlu diserahkan.</p>
          ) : (
            <div className="space-y-3">
              {siapDiserahkan.map((loan) => (
                <LoanCard key={loan.id} loan={loan} action={<ApprovalActions loanId={loan.id} stage="LABORAN" />} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sedang Dipinjam / Menunggu Pengembalian ({sedangDipinjam.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sedangDipinjam.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada barang yang sedang dipinjam.</p>
          ) : (
            <div className="space-y-3">
              {sedangDipinjam.map((loan) => (
                <LoanCard key={loan.id} loan={loan} action={<PengembalianForm loanId={loan.id} />} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
