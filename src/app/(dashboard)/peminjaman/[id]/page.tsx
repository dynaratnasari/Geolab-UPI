import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { KuponCard } from "@/components/peminjaman/kupon-card";
import { ApprovalActions } from "@/components/peminjaman/approval-actions";
import { InspectionForm } from "@/components/peminjaman/pengembalian-form";
import { ReturnScanButton } from "@/components/peminjaman/return-scan-button";
import { CancelLoanButton } from "@/components/peminjaman/cancel-loan-button";
import { KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";
import { cn } from "@/lib/utils";
import type { LoanStatus } from "@prisma/client";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}

function formatTanggalWaktu(date: Date) {
  const waktu = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(date);
  return `${formatTanggal(date)}, ${waktu}`;
}

// Statuses from READY_FOR_PICKUP onward all have a real kupon/nomor peminjaman to show —
// nothing before that, since QR/kupon is only ever generated once every required approval
// has actually completed.
const KUPON_VISIBLE_STATUSES: LoanStatus[] = [
  "READY_FOR_PICKUP",
  "BORROWED",
  "OVERDUE",
  "RETURN_PENDING_INSPECTION",
  "RETURNED",
  "RETURNED_DAMAGED",
  "RETURNED_LOST",
  "COMPLETED",
];

const PICKUP_DONE_STATUSES: LoanStatus[] = [
  "BORROWED",
  "OVERDUE",
  "RETURN_PENDING_INSPECTION",
  "RETURNED",
  "RETURNED_DAMAGED",
  "RETURNED_LOST",
  "COMPLETED",
];

const RETURN_DONE_STATUSES: LoanStatus[] = ["RETURNED", "RETURNED_DAMAGED", "RETURNED_LOST", "COMPLETED"];
const RETURN_IN_PROGRESS_STATUSES: LoanStatus[] = ["BORROWED", "OVERDUE", "RETURN_PENDING_INSPECTION"];

type StepState = "done" | "pending" | "rejected" | "upcoming";
type Step = { key: string; label: string; state: StepState; note?: string };

export default async function PeminjamanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) notFound();
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
      course: true,
      dosenPembimbing: true,
      items: { include: { item: true, unit: true } },
      approvals: { orderBy: { id: "asc" } },
      returns: true,
    },
  });

  if (!loan) notFound();
  if (profile.role === "MAHASISWA" && loan.mahasiswaId !== profile.id) notFound();

  // The QR encodes a URL to this very page, keyed by the loan's cuid — non-sequential and
  // effectively non-guessable, unlike nomorPeminjaman. Scanning it only ever navigates here;
  // this page is what reads the current status and decides which action to show.
  const showKupon = KUPON_VISIBLE_STATUSES.includes(loan.status);
  const qrDataUrl = showKupon ? await QRCode.toDataURL(`${getBaseUrl()}/peminjaman/${loan.id}`, { margin: 1, width: 240 }) : null;

  const laboranApproval = loan.approvals.find((a) => a.level === "LABORAN");
  const kepalaLabApproval = loan.approvals.find((a) => a.level === "KEPALA_LAB");

  const steps: Step[] = [
    {
      key: "laboran",
      label: "Laboran",
      state: !laboranApproval || laboranApproval.status === "MENUNGGU" ? "pending" : laboranApproval.status === "DISETUJUI" ? "done" : "rejected",
      note: laboranApproval?.decidedAt ? formatTanggal(laboranApproval.decidedAt) : undefined,
    },
  ];
  if (loan.jenisKeperluan !== "PRAKTIKUM") {
    steps.push({
      key: "kepala-lab",
      label: "Kepala Laboratorium",
      state: !kepalaLabApproval
        ? "upcoming"
        : kepalaLabApproval.status === "MENUNGGU"
          ? "pending"
          : kepalaLabApproval.status === "DISETUJUI"
            ? "done"
            : "rejected",
      note: kepalaLabApproval?.decidedAt ? formatTanggal(kepalaLabApproval.decidedAt) : undefined,
    });
  }
  steps.push(
    {
      key: "pengambilan",
      label: "Pengambilan Barang",
      state: PICKUP_DONE_STATUSES.includes(loan.status) ? "done" : loan.status === "READY_FOR_PICKUP" ? "pending" : "upcoming",
    },
    {
      key: "pengembalian",
      label: "Pengembalian & Pemeriksaan",
      state: RETURN_DONE_STATUSES.includes(loan.status) ? "done" : RETURN_IN_PROGRESS_STATUSES.includes(loan.status) ? "pending" : "upcoming",
      note: loan.returns[0] ? formatTanggal(loan.returns[0].tanggal) : undefined,
    },
  );

  const canCancel = profile.role === "MAHASISWA" && (loan.status === "WAITING_LABORAN_APPROVAL" || loan.status === "WAITING_HEAD_APPROVAL");
  const staffAction =
    profile.role === "LABORAN" && loan.status === "WAITING_LABORAN_APPROVAL" ? (
      <ApprovalActions loanId={loan.id} stage="LABORAN" />
    ) : profile.role === "KEPALA_LAB" && loan.status === "WAITING_HEAD_APPROVAL" ? (
      <ApprovalActions loanId={loan.id} stage="KEPALA_LAB" />
    ) : profile.role === "LABORAN" && loan.status === "READY_FOR_PICKUP" ? (
      <ApprovalActions loanId={loan.id} stage="PICKUP" />
    ) : profile.role === "LABORAN" && (loan.status === "BORROWED" || loan.status === "OVERDUE") ? (
      <ReturnScanButton loanId={loan.id} />
    ) : profile.role === "LABORAN" && loan.status === "RETURN_PENDING_INSPECTION" ? (
      <InspectionForm loanId={loan.id} pemeriksaDefaultNama={profile.name} />
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={profile.role === "MAHASISWA" ? "/peminjaman" : "/approval"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">{loan.nomorPeminjaman}</h1>
          <p className="text-sm text-muted-foreground">Diajukan {formatTanggal(loan.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <LoanStatusBadge status={loan.status} />
          {staffAction}
          {canCancel && <CancelLoanButton loanId={loan.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Informasi Peminjaman</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nama</p>
                <p className="font-medium text-foreground">{loan.mahasiswa.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NIM</p>
                <p className="font-medium text-foreground">{loan.mahasiswa.nim ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Program Studi</p>
                <p className="font-medium text-foreground">{loan.prodi ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mata Kuliah</p>
                <p className="font-medium text-foreground">{loan.course?.nama ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dosen Pengampu</p>
                <p className="font-medium text-foreground">{loan.dosenPengampu ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dosen Pembimbing</p>
                <p className="font-medium text-foreground">{loan.dosenPembimbing?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lokasi</p>
                <p className="font-medium text-foreground">{loan.lokasi ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu Pinjam</p>
                <p className="font-medium text-foreground">{formatTanggalWaktu(loan.tanggalPinjam)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Waktu Kembali</p>
                <p className="font-medium text-foreground">{formatTanggalWaktu(loan.tanggalKembali)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Keperluan</p>
                <p className="font-medium text-foreground">
                  {KEPERLUAN_LABEL[loan.jenisKeperluan]}
                  {loan.keperluan ? ` — ${loan.keperluan}` : ""}
                </p>
              </div>
              {loan.suratUrl && (
                <div className="col-span-2">
                  <a
                    href={loan.suratUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-upi-700 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Lihat surat lampiran
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Daftar Barang</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {loan.items.map((li) => (
                  <li key={li.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-foreground">{li.item.nama}</span>
                      {li.unit && <span className="ml-2 font-mono text-xs text-muted-foreground">{li.unit.kodeUnit}</span>}
                    </div>
                    <span className="text-muted-foreground">{li.jumlah} unit</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Alur Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.state === "done" ? CheckCircle2 : step.state === "rejected" ? XCircle : Clock;
                  const tone =
                    step.state === "done"
                      ? "text-emerald-600 bg-emerald-50"
                      : step.state === "rejected"
                        ? "text-red-600 bg-red-50"
                        : step.state === "pending"
                          ? "text-violet-600 bg-violet-50"
                          : "text-muted-foreground bg-muted";
                  const noteText =
                    step.state === "upcoming"
                      ? "Belum sampai tahap ini"
                      : step.state === "pending"
                        ? "Menunggu diproses"
                        : step.state === "rejected"
                          ? `Ditolak${step.note ? " · " + step.note : ""}`
                          : `Selesai${step.note ? " · " + step.note : ""}`;
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{noteText}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {showKupon && qrDataUrl && (
            <KuponCard
              data={{
                nomorPeminjaman: loan.nomorPeminjaman,
                nama: loan.mahasiswa.name,
                nim: loan.mahasiswa.nim ?? "—",
                barang: loan.items.map((i) => (i.unit ? `${i.item.nama} (${i.unit.kodeUnit})` : i.item.nama)),
                tanggalPinjam: formatTanggalWaktu(loan.tanggalPinjam),
                tanggalKembali: formatTanggalWaktu(loan.tanggalKembali),
                status: loan.status,
                qrDataUrl,
              }}
            />
          )}

          {loan.returns.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Pengembalian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {loan.returns.map((r) => (
                  <div key={r.id}>
                    <p className="font-medium text-foreground">{r.kondisi.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTanggalWaktu(r.tanggal)}
                      {r.pemeriksaNama ? ` · Diperiksa oleh ${r.pemeriksaNama}` : ""}
                    </p>
                    {r.catatan && <p className="mt-1 text-xs text-muted-foreground">{r.catatan}</p>}
                    {r.fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.fotoUrl} alt="Kondisi barang saat dikembalikan" className="mt-2 w-full rounded-lg border border-border" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
