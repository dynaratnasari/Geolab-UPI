"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOAN_STATUS_LABEL } from "@/components/peminjaman/loan-status-badge";
import type { LoanStatus } from "@prisma/client";

export interface KuponData {
  nomorPeminjaman: string;
  nama: string;
  nim: string;
  barang: string[];
  tanggalPinjam: string;
  tanggalKembali: string;
  status: LoanStatus;
  qrDataUrl: string;
}

/** Loads a same-origin image from /public so jsPDF can embed it — addImage() needs an
 *  actual loaded element, not just a URL string. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function KuponCard({ data }: { data: KuponData }) {
  async function handleDownload() {
    const { jsPDF } = await import("jspdf");
    const [geolabLogo, upiLogo] = await Promise.all([loadImage("/logo-geolab.png"), loadImage("/logo-upi.jpg")]);
    const doc = new jsPDF({ unit: "pt", format: [320, 480] });

    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, 320, 78, "F");

    // Both logos sit on a white badge — logo-upi.jpg has no transparency of its own, and this
    // matches how the app already frames them elsewhere (white circle/box, never bare on color).
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(19, 14, 36, 36, 18, 18, "F");
    doc.addImage(upiLogo, "JPEG", 22, 17, 30, 30);

    const geolabImgH = 28;
    const geolabImgW = geolabImgH * (geolabLogo.naturalWidth / geolabLogo.naturalHeight);
    const geolabBadgeW = geolabImgW + 16;
    const geolabBadgeX = 320 - 19 - geolabBadgeW;
    doc.roundedRect(geolabBadgeX, 14, geolabBadgeW, 36, 6, 6, "F");
    doc.addImage(geolabLogo, "PNG", geolabBadgeX + 8, 14 + (36 - geolabImgH) / 2, geolabImgW, geolabImgH);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Kupon Peminjaman Digital", 160, 64, { align: "center" });

    doc.addImage(data.qrDataUrl, "PNG", 100, 98, 120, 120);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(data.nomorPeminjaman, 160, 238, { align: "center" });

    let y = 264;
    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(value, 20, y + 14, { maxWidth: 280 });
      y += 38;
    };

    row("NAMA", data.nama);
    row("NIM", data.nim);
    row("BARANG", data.barang.join(", "));
    row("PINJAM", data.tanggalPinjam);
    row("KEMBALI", data.tanggalKembali);
    row("STATUS", LOAN_STATUS_LABEL[data.status]);

    doc.save(`Kupon-${data.nomorPeminjaman}.pdf`);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center shadow-soft">
      <div className="mx-auto -mt-6 mb-4 w-fit rounded-xl bg-upi-700 px-4 py-2 text-white shadow-soft">
        <p className="text-sm font-bold">GeoLab UPI</p>
        <p className="text-xs opacity-90">Kupon Peminjaman Digital</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qrDataUrl} alt={`QR ${data.nomorPeminjaman}`} className="mx-auto h-40 w-40" />
      <p className="mt-3 font-mono text-sm font-semibold text-foreground">{data.nomorPeminjaman}</p>
      <dl className="mt-4 space-y-2 text-left text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Nama</dt>
          <dd className="font-medium text-foreground">{data.nama}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">NIM</dt>
          <dd className="font-medium text-foreground">{data.nim}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Barang</dt>
          <dd className="text-right font-medium text-foreground">{data.barang.join(", ")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Pinjam</dt>
          <dd className="text-right font-medium text-foreground">{data.tanggalPinjam}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Kembali</dt>
          <dd className="text-right font-medium text-foreground">{data.tanggalKembali}</dd>
        </div>
      </dl>
      <Button onClick={handleDownload} className="mt-5 w-full bg-upi-700 hover:bg-upi-800">
        <Download className="h-4 w-4" />
        Unduh Kupon (PDF)
      </Button>
    </div>
  );
}
