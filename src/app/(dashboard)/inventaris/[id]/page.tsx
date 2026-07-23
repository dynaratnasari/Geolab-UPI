import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Boxes, MapPin, Wallet, CalendarDays, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KondisiBadge } from "@/components/inventaris/kondisi-badge";
import { UnitStatusBadge } from "@/components/inventaris/unit-status-badge";
import { TipeAlatSelect } from "@/components/inventaris/tipe-alat-select";
import { TIPE_ALAT_LABEL } from "@/lib/constants/inventaris";

function formatTanggal(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatHarga(harga: unknown) {
  if (harga === null || harga === undefined) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number(harga),
  );
}

export default async function DetailBarangPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole();
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      photos: { orderBy: { order: "asc" } },
      maintenanceLogs: { orderBy: { tanggal: "desc" }, include: { by: true } },
      locationHistories: { orderBy: { tanggal: "desc" }, include: { toLocation: true } },
      units: { orderBy: { kodeUnit: "asc" } },
    },
  });

  if (!item) notFound();

  const isSerialized = item.tipeAlat !== "TIPE_1";

  const qrDataUrl = isSerialized
    ? null
    : await QRCode.toDataURL(item.kodeQr, { margin: 1, width: 240, color: { dark: "#0f172a" } });

  const unitQrCodes = isSerialized
    ? await Promise.all(
        item.units.map((u) => QRCode.toDataURL(u.kodeQr, { margin: 1, width: 160, color: { dark: "#0f172a" } })),
      )
    : [];

  const specRows: [string, string][] = [
    ["Kategori", item.category.nama],
    ["Merk", item.merk ?? "—"],
    ["Spesifikasi", item.spesifikasi ?? "—"],
    ["Sumber Dana", item.sumberDana ?? "—"],
    ["Tanggal Pembelian", formatTanggal(item.tanggalPembelian)],
    ["Harga", formatHarga(item.harga)],
  ];

  return (
    <div className="space-y-6">
      <Link href="/inventaris" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Inventaris
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: photo + gallery + info */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
                <Boxes className="h-16 w-16 text-muted-foreground/30" />
              </div>
              {item.photos.length > 0 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {item.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.id} src={p.url} alt={p.caption ?? item.nama} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Belum ada foto tambahan di galeri.</p>
              )}

              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.nama}</h1>
                  <p className="text-sm text-muted-foreground">{item.kodeInventaris}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <KondisiBadge kondisi={item.kondisi} />
                  {profile.role === "KEPALA_LAB" && <TipeAlatSelect itemId={item.id} tipeAlat={item.tipeAlat} />}
                  {profile.role !== "KEPALA_LAB" && profile.role !== "MAHASISWA" && (
                    <span className="text-xs text-muted-foreground">{TIPE_ALAT_LABEL[item.tipeAlat]}</span>
                  )}
                </div>
              </div>

              {item.deskripsi && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.deskripsi}</p>}

              <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-6 sm:grid-cols-2">
                {specRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Riwayat Perawatan</CardTitle>
            </CardHeader>
            <CardContent>
              {item.maintenanceLogs.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Belum ada riwayat perawatan.</p>
              ) : (
                <ul className="space-y-3">
                  {item.maintenanceLogs.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                      <div>
                        <p className="text-sm text-foreground">{log.catatan}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTanggal(log.tanggal)} {log.by ? `· ${log.by.name}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Riwayat Perpindahan Lokasi</CardTitle>
            </CardHeader>
            <CardContent>
              {item.locationHistories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Belum ada riwayat perpindahan lokasi.</p>
              ) : (
                <ul className="space-y-3">
                  {item.locationHistories.map((h) => (
                    <li key={h.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-upi-700" />
                      <div>
                        <p className="text-sm text-foreground">Dipindahkan ke {h.toLocation?.ruangan ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{formatTanggal(h.tanggal)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Timeline Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-sm text-muted-foreground">
                Belum ada data peminjaman — modul Peminjaman dibangun di fase berikutnya.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: QR, status, location */}
        <div className="space-y-6">
          {isSerialized ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Daftar Unit ({item.units.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.units.map((unit, i) => (
                  <div key={unit.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={unitQrCodes[i]} alt={`QR ${unit.kodeQr}`} className="h-14 w-14 shrink-0 rounded border border-border p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-medium text-foreground">{unit.kodeUnit}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <UnitStatusBadge status={unit.status} />
                        <KondisiBadge kondisi={unit.kondisi} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Kode QR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl!} alt={`QR ${item.kodeQr}`} className="h-40 w-40 rounded-lg border border-border p-2" />
                <p className="font-mono text-xs text-muted-foreground">{item.kodeQr}</p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Status Realtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">{item.jumlahTotal} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tersedia</span>
                <span className="font-medium text-emerald-600">{item.jumlahTersedia} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dipinjam</span>
                <span className="font-medium text-upi-700">{item.jumlahDipinjam} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-medium text-orange-600">{item.jumlahMaintenance} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rusak</span>
                <span className="font-medium text-red-600">{item.jumlahRusak} unit</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Sedang dipinjam oleh</span>
                <span className="font-medium text-muted-foreground">—</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Lokasi Penyimpanan</CardTitle>
            </CardHeader>
            <CardContent>
              {item.location ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-upi-700" />
                    <span className="font-medium text-foreground">{item.location.ruangan}</span>
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">{item.location.gedung}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Lokasi belum ditentukan.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Jadwal Penggunaan Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada jadwal penggunaan terkait alat ini.</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Manual Book</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {item.manualBookUrl ? (
                  <a href={item.manualBookUrl} className="text-upi-700 hover:underline">
                    Unduh Manual Book (PDF)
                  </a>
                ) : (
                  "Belum diunggah."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
