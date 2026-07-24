import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanStatusBadge } from "@/components/peminjaman/loan-status-badge";
import { KuponCard } from "@/components/peminjaman/kupon-card";
import { KEPERLUAN_LABEL } from "@/lib/constants/peminjaman";
import { cn } from "@/lib/utils";

function formatTanggal(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}

function formatTanggalWaktu(date: Date) {
  const waktu = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(date);
  return `${formatTanggal(date)}, ${waktu}`;
}

const APPROVAL_LEVEL_LABEL = { DOSEN: "Dosen Pengampu", KEPALA_LAB: "Kepala Laboratorium", LABORAN: "Laboran" };

export default async function PeminjamanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) notFound();
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
      course: true,
      items: { include: { item: true, unit: true } },
      approvals: { orderBy: { level: "asc" } },
      returns: true,
    },
  });

  if (!loan) notFound();
  if (profile.role === "MAHASISWA" && loan.mahasiswaId !== profile.id) notFound();

  const showKupon = ["DISETUJUI", "DIAMBIL", "DIKEMBALIKAN"].includes(loan.status);
  const qrDataUrl = showKupon ? await QRCode.toDataURL(loan.nomorPeminjaman, { margin: 1, width: 240 }) : null;

  const steps: { level: keyof typeof APPROVAL_LEVEL_LABEL }[] =
    loan.jenisKeperluan !== "PRAKTIKUM" ? [{ level: "KEPALA_LAB" }, { level: "LABORAN" }] : [{ level: "LABORAN" }];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={profile.role === "MAHASISWA" ? "/peminjaman" : "/approval"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">{loan.nomorPeminjaman}</h1>
          <p className="text-sm text-muted-foreground">Diajukan {formatTanggal(loan.createdAt)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
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
              <CardTitle className="text-sm font-semibold">Alur Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {steps.map((step) => {
                  const approval = loan.approvals.find((a) => a.level === step.level);
                  const Icon = !approval
                    ? Clock
                    : approval.status === "DISETUJUI"
                      ? CheckCircle2
                      : approval.status === "DITOLAK"
                        ? XCircle
                        : Clock;
                  const tone = !approval
                    ? "text-muted-foreground bg-muted"
                    : approval.status === "DISETUJUI"
                      ? "text-emerald-600 bg-emerald-50"
                      : approval.status === "DITOLAK"
                        ? "text-red-600 bg-red-50"
                        : "text-violet-600 bg-violet-50";
                  return (
                    <li key={step.level} className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{APPROVAL_LEVEL_LABEL[step.level]}</p>
                        <p className="text-xs text-muted-foreground">
                          {approval
                            ? approval.status === "MENUNGGU"
                              ? "Menunggu keputusan"
                              : `${approval.status === "DISETUJUI" ? "Disetujui" : "Ditolak"}${
                                  approval.decidedAt ? " · " + formatTanggal(approval.decidedAt) : ""
                                }`
                            : "Belum sampai tahap ini"}
                        </p>
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
              <CardContent className="space-y-2 text-sm">
                {loan.returns.map((r) => (
                  <div key={r.id}>
                    <p className="font-medium text-foreground">{r.kondisiCheck}</p>
                    <p className="text-xs text-muted-foreground">{formatTanggal(r.tanggal)}</p>
                    {r.catatan && <p className="mt-1 text-xs text-muted-foreground">{r.catatan}</p>}
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
