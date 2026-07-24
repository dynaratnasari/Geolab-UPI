import "server-only";
import { prisma } from "@/lib/prisma";
import { LAPORAN_TYPES, type LaporanType, type LaporanResult } from "@/lib/constants/laporan";

export { LAPORAN_TYPES };
export type { LaporanType, LaporanColumn, LaporanResult } from "@/lib/constants/laporan";

function formatTanggal(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export async function getLaporanData(type: LaporanType): Promise<LaporanResult> {
  switch (type) {
    case "inventaris": {
      const items = await prisma.inventoryItem.findMany({
        include: { category: true, location: true },
        orderBy: { nama: "asc" },
      });
      return {
        columns: [
          { key: "kode", label: "Kode" },
          { key: "nama", label: "Nama Barang" },
          { key: "kategori", label: "Kategori" },
          { key: "merk", label: "Merk" },
          { key: "total", label: "Total" },
          { key: "tersedia", label: "Tersedia" },
          { key: "dipinjam", label: "Dipinjam" },
          { key: "lokasi", label: "Lokasi" },
          { key: "kondisi", label: "Kondisi" },
        ],
        rows: items.map((i) => ({
          kode: i.kodeInventaris,
          nama: i.nama,
          kategori: i.category.nama,
          merk: i.merk ?? "—",
          total: i.jumlahTotal,
          tersedia: i.jumlahTersedia,
          dipinjam: i.jumlahDipinjam,
          lokasi: i.location?.ruangan ?? "—",
          kondisi: i.kondisi,
        })),
      };
    }

    case "barang-rusak": {
      const items = await prisma.inventoryItem.findMany({
        where: { OR: [{ kondisi: "RUSAK" }, { jumlahRusak: { gt: 0 } }] },
        include: { category: true, location: true },
        orderBy: { nama: "asc" },
      });
      return {
        columns: [
          { key: "kode", label: "Kode" },
          { key: "nama", label: "Nama Barang" },
          { key: "kategori", label: "Kategori" },
          { key: "jumlahRusak", label: "Jumlah Rusak" },
          { key: "lokasi", label: "Lokasi" },
        ],
        rows: items.map((i) => ({
          kode: i.kodeInventaris,
          nama: i.nama,
          kategori: i.category.nama,
          jumlahRusak: i.jumlahRusak,
          lokasi: i.location?.ruangan ?? "—",
        })),
      };
    }

    case "barang-hilang": {
      const items = await prisma.inventoryItem.findMany({
        where: { OR: [{ kondisi: "HILANG" }, { jumlahHilang: { gt: 0 } }] },
        include: { category: true, location: true },
        orderBy: { nama: "asc" },
      });
      return {
        columns: [
          { key: "kode", label: "Kode" },
          { key: "nama", label: "Nama Barang" },
          { key: "kategori", label: "Kategori" },
          { key: "jumlahHilang", label: "Jumlah Hilang" },
          { key: "lokasi", label: "Lokasi Terakhir" },
        ],
        rows: items.map((i) => ({
          kode: i.kodeInventaris,
          nama: i.nama,
          kategori: i.category.nama,
          jumlahHilang: i.jumlahHilang,
          lokasi: i.location?.ruangan ?? "—",
        })),
      };
    }

    case "maintenance": {
      const items = await prisma.inventoryItem.findMany({
        where: { OR: [{ kondisi: "MAINTENANCE" }, { jumlahMaintenance: { gt: 0 } }] },
        include: { category: true, location: true, maintenanceLogs: { orderBy: { tanggal: "desc" }, take: 1 } },
        orderBy: { nama: "asc" },
      });
      return {
        columns: [
          { key: "kode", label: "Kode" },
          { key: "nama", label: "Nama Barang" },
          { key: "kategori", label: "Kategori" },
          { key: "jumlahMaintenance", label: "Jumlah Maintenance" },
          { key: "catatan", label: "Catatan Terakhir" },
          { key: "tanggal", label: "Tanggal" },
        ],
        rows: items.map((i) => ({
          kode: i.kodeInventaris,
          nama: i.nama,
          kategori: i.category.nama,
          jumlahMaintenance: i.jumlahMaintenance,
          catatan: i.maintenanceLogs[0]?.catatan ?? "—",
          tanggal: formatTanggal(i.maintenanceLogs[0]?.tanggal ?? null),
        })),
      };
    }

    case "barang-dipinjam": {
      const loans = await prisma.loan.findMany({
        where: { status: { in: ["DIAMBIL", "TERLAMBAT"] } },
        include: { mahasiswa: true, items: { include: { item: true } } },
        orderBy: { tanggalKembali: "asc" },
      });
      return {
        columns: [
          { key: "nomor", label: "Nomor" },
          { key: "mahasiswa", label: "Mahasiswa" },
          { key: "nim", label: "NIM" },
          { key: "barang", label: "Barang" },
          { key: "tanggalPinjam", label: "Tanggal Pinjam" },
          { key: "tanggalKembali", label: "Rencana Kembali" },
          { key: "status", label: "Status" },
        ],
        rows: loans.map((l) => ({
          nomor: l.nomorPeminjaman,
          mahasiswa: l.mahasiswa.name,
          nim: l.mahasiswa.nim ?? "—",
          barang: l.items.map((li) => `${li.item.nama} (${li.jumlah})`).join(", "),
          tanggalPinjam: formatTanggal(l.tanggalPinjam),
          tanggalKembali: formatTanggal(l.tanggalKembali),
          status: l.status === "TERLAMBAT" ? "Terlambat" : "Dipinjam",
        })),
      };
    }

    case "keterlambatan": {
      const now = new Date();
      const [sedangTerlambat, sudahDikembalikan] = await Promise.all([
        prisma.loan.findMany({
          where: { status: "TERLAMBAT" },
          include: { mahasiswa: true, items: { include: { item: true } } },
          orderBy: { tanggalKembali: "asc" },
        }),
        prisma.loan.findMany({
          where: { status: "DIKEMBALIKAN" },
          include: { mahasiswa: true, items: { include: { item: true } }, returns: { orderBy: { tanggal: "desc" }, take: 1 } },
        }),
      ]);

      const hariTerlambat = (dueDate: Date, actual: Date) =>
        Math.max(1, Math.ceil((actual.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      const rows = [
        ...sedangTerlambat.map((l) => ({
          nomor: l.nomorPeminjaman,
          mahasiswa: l.mahasiswa.name,
          nim: l.mahasiswa.nim ?? "—",
          barang: l.items.map((li) => li.item.nama).join(", "),
          tanggalKembali: formatTanggal(l.tanggalKembali),
          tanggalDikembalikan: "—",
          hariTerlambat: hariTerlambat(l.tanggalKembali, now),
          status: "Masih Dipinjam",
        })),
        ...sudahDikembalikan
          .filter((l) => l.returns[0] && l.returns[0].tanggal > l.tanggalKembali)
          .map((l) => ({
            nomor: l.nomorPeminjaman,
            mahasiswa: l.mahasiswa.name,
            nim: l.mahasiswa.nim ?? "—",
            barang: l.items.map((li) => li.item.nama).join(", "),
            tanggalKembali: formatTanggal(l.tanggalKembali),
            tanggalDikembalikan: formatTanggal(l.returns[0].tanggal),
            hariTerlambat: hariTerlambat(l.tanggalKembali, l.returns[0].tanggal),
            status: "Sudah Dikembalikan",
          })),
      ];

      return {
        columns: [
          { key: "nomor", label: "Nomor" },
          { key: "mahasiswa", label: "Mahasiswa" },
          { key: "nim", label: "NIM" },
          { key: "barang", label: "Barang" },
          { key: "tanggalKembali", label: "Rencana Kembali" },
          { key: "tanggalDikembalikan", label: "Tanggal Dikembalikan" },
          { key: "hariTerlambat", label: "Hari Terlambat" },
          { key: "status", label: "Status" },
        ],
        rows,
      };
    }

    case "peminjaman-mahasiswa": {
      const loans = await prisma.loan.findMany({
        include: { mahasiswa: true, course: true },
        orderBy: { createdAt: "desc" },
      });
      return {
        columns: [
          { key: "nomor", label: "Nomor" },
          { key: "mahasiswa", label: "Mahasiswa" },
          { key: "nim", label: "NIM" },
          { key: "prodi", label: "Prodi" },
          { key: "mataKuliah", label: "Mata Kuliah" },
          { key: "tanggalPinjam", label: "Tanggal Pinjam" },
          { key: "status", label: "Status" },
        ],
        rows: loans.map((l) => ({
          nomor: l.nomorPeminjaman,
          mahasiswa: l.mahasiswa.name,
          nim: l.mahasiswa.nim ?? "—",
          prodi: l.prodi ?? "—",
          mataKuliah: l.course?.nama ?? "—",
          tanggalPinjam: formatTanggal(l.tanggalPinjam),
          status: l.status,
        })),
      };
    }

    case "praktikum": {
      const schedules = await prisma.schedule.findMany({
        include: { course: true, dosen: true },
        orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
      });
      return {
        columns: [
          { key: "hari", label: "Hari" },
          { key: "jam", label: "Jam" },
          { key: "mataKuliah", label: "Mata Kuliah" },
          { key: "dosen", label: "Dosen" },
          { key: "ruangan", label: "Ruangan" },
          { key: "kelas", label: "Kelas" },
        ],
        rows: schedules.map((s) => ({
          hari: s.hari,
          jam: `${s.jamMulai}-${s.jamSelesai}`,
          mataKuliah: s.course.nama,
          dosen: s.dosen?.name ?? "—",
          ruangan: s.ruanganLabel ?? "—",
          kelas: s.kelas ?? "—",
        })),
      };
    }
  }
}
