import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  PackageCheck,
  Wrench,
  AlertTriangle,
  HelpCircle,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  PackageSearch,
  RotateCcw,
} from "lucide-react";
import { requireRole, ROLE_LABELS } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { KondisiChart } from "@/components/dashboard/kondisi-chart";
import { KategoriChart } from "@/components/dashboard/kategori-chart";
import { PengadaanChart } from "@/components/dashboard/pengadaan-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { JadwalList } from "@/components/dashboard/jadwal-list";
import { MahasiswaDashboard } from "@/components/dashboard/mahasiswa-dashboard";
import {
  getInventoryStats,
  getKondisiBreakdown,
  getKategoriBreakdown,
  getPengadaanPerTahun,
  getJadwalHariIni,
  getJadwalBerikutnya,
  getLaboranTasks,
  getKepalaLabPendingApprovals,
  getRecentActivity,
} from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const profile = await requireRole();

  if (profile.role === "MAHASISWA") {
    return <MahasiswaDashboard profile={profile} />;
  }

  const isLaboran = profile.role === "LABORAN";
  const isKepalaLab = profile.role === "KEPALA_LAB";

  const [stats, kondisi, kategori, pengadaan, jadwalHariIni, jadwalBerikutnya, laboranTasks, kepalaLabApprovals, activity] =
    await Promise.all([
      getInventoryStats(),
      getKondisiBreakdown(),
      getKategoriBreakdown(),
      getPengadaanPerTahun(),
      getJadwalHariIni(),
      getJadwalBerikutnya(),
      isLaboran ? getLaboranTasks() : Promise.resolve(null),
      isKepalaLab ? getKepalaLabPendingApprovals() : Promise.resolve(null),
      getRecentActivity(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {profile.name} — {ROLE_LABELS[profile.role]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Inventaris" value={stats.total} icon={Boxes} tone="default" />
        <StatCard label="Barang Tersedia" value={stats.tersedia} icon={CheckCircle2} tone="success" />
        <StatCard label="Barang Dipinjam" value={stats.dipinjam} icon={PackageCheck} tone="info" />
        <StatCard label="Maintenance" value={stats.maintenance} icon={Wrench} tone="warning" />
        <StatCard label="Barang Rusak" value={stats.rusak} icon={AlertTriangle} tone="danger" />
        <StatCard label="Barang Hilang" value={stats.hilang} icon={HelpCircle} tone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Praktikum Hari Ini" value={jadwalHariIni.length} icon={CalendarCheck} tone="default" />
        <StatCard label="Jadwal Berikutnya" value={jadwalBerikutnya.length} icon={CalendarClock} tone="info" />
        {isLaboran && (
          <StatCard label="Menunggu Persetujuan Anda" value={laboranTasks!.menungguPersetujuan} icon={ClipboardList} tone="warning" />
        )}
        {isKepalaLab && (
          <StatCard label="Menunggu Persetujuan Anda" value={kepalaLabApprovals!} icon={ClipboardList} tone="warning" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Kondisi Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <KondisiChart data={kondisi} />
          </CardContent>
        </Card>
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Inventaris berdasarkan Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <KategoriChart data={kategori} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Pengadaan Alat per Tahun</CardTitle>
          </CardHeader>
          <CardContent>
            <PengadaanChart data={pengadaan} />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tugas Anda</CardTitle>
          </CardHeader>
          <CardContent>
            {isLaboran && laboranTasks && (
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    Menunggu persetujuan Anda
                  </span>
                  <span className="font-semibold text-foreground">{laboranTasks.menungguPersetujuan}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PackageSearch className="h-4 w-4" />
                    Siap diserahkan
                  </span>
                  <span className="font-semibold text-foreground">{laboranTasks.siapDiserahkan}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <RotateCcw className="h-4 w-4" />
                    Menunggu pengembalian
                  </span>
                  <span className="font-semibold text-foreground">{laboranTasks.menungguPengembalian}</span>
                </li>
              </ul>
            )}
            {isKepalaLab && (
              <p className="py-2 text-sm text-muted-foreground">
                <span className="mr-2 text-2xl font-bold text-foreground">{kepalaLabApprovals}</span>
                pengajuan riset/kegiatan lain menunggu persetujuan Anda.
              </p>
            )}
            {!isLaboran && !isKepalaLab && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Lihat aktivitas peminjaman mahasiswa pada mata kuliah Anda di Monitoring Mahasiswa.
              </p>
            )}
            {(isLaboran || isKepalaLab) && (
              <Link href="/approval" className="mt-4 block text-center text-sm font-medium text-upi-700 hover:underline">
                Buka Approval &amp; Serah Terima
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Praktikum Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <JadwalList schedules={jadwalHariIni} emptyLabel="Tidak ada praktikum hari ini." />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Praktikum Berikutnya</CardTitle>
          </CardHeader>
          <CardContent>
            <JadwalList schedules={jadwalBerikutnya} emptyLabel="Tidak ada jadwal berikutnya." />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
