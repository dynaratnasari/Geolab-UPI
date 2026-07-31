import Link from "next/link";
import { ClipboardCheck, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalActions } from "@/components/peminjaman/approval-actions";
import { InspectionForm } from "@/components/peminjaman/pengembalian-form";
import { ReturnScanButton } from "@/components/peminjaman/return-scan-button";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { KEPERLUAN_LABEL, KONDISI_LABEL, GOOD_RETURN_CONDITIONS } from "@/lib/constants/peminjaman";
import { cn } from "@/lib/utils";
import type { KeperluanType, LoanStatus } from "@prisma/client";

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
    status?: LoanStatus;
  };
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
            {(loan.status === "OVERDUE" || loan.status === "RETURN_PENDING_INSPECTION") && (
              <LoanStatusBadge status={loan.status} />
            )}
          </div>
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
    const loans = await prisma.loan.findMany({ where: { status: "WAITING_HEAD_APPROVAL" }, include: loanInclude, orderBy: { createdAt: "asc" } });
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval Peminjaman</h1>
          <p className="text-sm text-muted-foreground">Pengajuan riset/kegiatan lain yang sudah disetujui Laboran, menunggu persetujuan Anda.</p>
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

  // LABORAN: persetujuan awal (WAITING_LABORAN_APPROVAL) + serah terima (READY_FOR_PICKUP)
  // + pengembalian (BORROWED/OVERDUE/RETURN_PENDING_INSPECTION) + riwayat sudah dikembalikan
  const [menungguPersetujuan, siapDiserahkan, sedangDipinjam, sudahDikembalikan] = await Promise.all([
    prisma.loan.findMany({ where: { status: "WAITING_LABORAN_APPROVAL" }, include: loanInclude, orderBy: { createdAt: "asc" } }),
    prisma.loan.findMany({ where: { status: "READY_FOR_PICKUP" }, include: loanInclude, orderBy: { createdAt: "asc" } }),
    prisma.loan.findMany({
      where: { status: { in: ["BORROWED", "OVERDUE", "RETURN_PENDING_INSPECTION"] } },
      include: loanInclude,
      orderBy: { tanggalKembali: "asc" },
    }),
    prisma.loan.findMany({
      where: { status: { in: ["RETURNED", "RETURNED_DAMAGED", "RETURNED_LOST"] } },
      include: { mahasiswa: true, items: { include: { item: true, unit: true } }, returns: { orderBy: { tanggal: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Approval & Serah Terima</h1>
          <p className="text-sm text-muted-foreground">Setujui pengajuan, serahkan barang, dan proses pengembalian.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/approval/riwayat-buruk">
            <AlertTriangle className="mr-1.5 h-4 w-4 text-red-600" />
            Riwayat Kondisi Pengembalian dalam Perhatian
          </Link>
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Menunggu Persetujuan Anda ({menungguPersetujuan.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {menungguPersetujuan.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada pengajuan yang menunggu persetujuan Anda.</p>
          ) : (
            <div className="space-y-3">
              {menungguPersetujuan.map((loan) => (
                <LoanCard key={loan.id} loan={loan} action={<ApprovalActions loanId={loan.id} stage="LABORAN" />} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <LoanCard key={loan.id} loan={loan} action={<ApprovalActions loanId={loan.id} stage="PICKUP" />} />
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
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  action={
                    loan.status === "RETURN_PENDING_INSPECTION" ? (
                      <InspectionForm loanId={loan.id} pemeriksaDefaultNama={profile.name} />
                    ) : (
                      <ReturnScanButton loanId={loan.id} />
                    )
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sudah Dikembalikan ({sudahDikembalikan.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sudahDikembalikan.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Belum ada barang yang dikembalikan.</p>
          ) : (
            <div className="space-y-3">
              {sudahDikembalikan.map((loan) => {
                const r = loan.returns[0];
                const good = r ? GOOD_RETURN_CONDITIONS.includes(r.kondisi) : true;
                return (
                  <div key={loan.id} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{loan.nomorPeminjaman}</p>
                        <Link href={`/peminjaman/${loan.id}`} className="font-medium text-foreground hover:underline">
                          {loan.mahasiswa.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {loan.items.map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : `${i.item.nama} (${i.jumlah})`)).join(", ")}
                        </p>
                        {r && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Dikembalikan {formatTanggal(r.tanggal)}
                            {r.pemeriksaNama ? ` · Diperiksa oleh ${r.pemeriksaNama}` : ""}
                          </p>
                        )}
                      </div>
                      {r && (
                        <p className={cn("shrink-0 text-sm font-semibold", good ? "text-foreground" : "text-red-600")}>
                          {KONDISI_LABEL[r.kondisi]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
