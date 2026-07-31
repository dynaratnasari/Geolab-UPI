import "server-only";
import { prisma } from "@/lib/prisma";
import { LAPORAN_TYPES, type LaporanType, type LaporanResult } from "@/lib/constants/laporan";
import { LOAN_STATUS_LABEL } from "@/components/peminjaman/loan-status-badge";

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
        where: { status: { in: ["BORROWED", "OVERDUE"] } },
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
          status: l.status === "OVERDUE" ? "Terlambat" : "Dipinjam",
        })),
      };
    }

    case "keterlambatan": {
      const now = new Date();
      const [sedangTerlambat, sudahDikembalikan] = await Promise.all([
        prisma.loan.findMany({
          where: { status: "OVERDUE" },
          include: { mahasiswa: true, items: { include: { item: true } } },
          orderBy: { tanggalKembali: "asc" },
        }),
        prisma.loan.findMany({
          where: { status: { in: ["RETURNED", "RETURNED_DAMAGED", "RETURNED_LOST", "COMPLETED"] } },
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

    case "peminjam-bermasalah": {
      // "Bermasalah" = pernah/sedang terlambat, atau alat kembali dalam kondisi rusak/hilang.
      // Satu mahasiswa/peminjaman bisa punya lebih dari satu jenis masalah sekaligus.
      const [overdueLoans, badReturnLoans, finishedLoans] = await Promise.all([
        prisma.loan.findMany({
          where: { status: "OVERDUE" },
          include: { mahasiswa: true, items: { include: { item: true } } },
        }),
        prisma.loan.findMany({
          where: { status: { in: ["RETURNED_DAMAGED", "RETURNED_LOST"] } },
          include: { mahasiswa: true, items: { include: { item: true } } },
        }),
        prisma.loan.findMany({
          where: { status: { in: ["RETURNED", "RETURNED_DAMAGED", "RETURNED_LOST", "COMPLETED"] } },
          include: { mahasiswa: true, items: { include: { item: true } }, returns: { orderBy: { tanggal: "desc" }, take: 1 } },
        }),
      ]);

      interface BermasalahRow {
        mahasiswa: string;
        nim: string;
        tanggalPinjam: Date;
        barang: string;
        masalah: string[];
      }
      const byLoan = new Map<string, BermasalahRow>();
      function ensure(loan: { id: string; mahasiswa: { name: string; nim: string | null }; tanggalPinjam: Date; items: { item: { nama: string } }[] }) {
        let row = byLoan.get(loan.id);
        if (!row) {
          row = {
            mahasiswa: loan.mahasiswa.name,
            nim: loan.mahasiswa.nim ?? "—",
            tanggalPinjam: loan.tanggalPinjam,
            barang: loan.items.map((li) => li.item.nama).join(", "),
            masalah: [],
          };
          byLoan.set(loan.id, row);
        }
        return row;
      }

      for (const l of overdueLoans) ensure(l).masalah.push("Masih terlambat (belum dikembalikan)");
      for (const l of badReturnLoans) {
        ensure(l).masalah.push(l.status === "RETURNED_LOST" ? "Barang hilang" : "Barang rusak saat dikembalikan");
      }
      for (const l of finishedLoans) {
        const kembali = l.returns[0]?.tanggal;
        if (kembali && kembali > l.tanggalKembali) ensure(l).masalah.push("Terlambat mengembalikan");
      }

      const rows = Array.from(byLoan.entries())
        .sort(([, a], [, b]) => b.tanggalPinjam.getTime() - a.tanggalPinjam.getTime())
        .map(([, r]) => ({
          mahasiswa: r.mahasiswa,
          nim: r.nim,
          tanggalPinjam: formatTanggal(r.tanggalPinjam),
          barang: r.barang,
          masalah: r.masalah.join(" · "),
        }));

      return {
        columns: [
          { key: "mahasiswa", label: "Nama Peminjam" },
          { key: "nim", label: "NIM" },
          { key: "tanggalPinjam", label: "Tanggal Peminjaman" },
          { key: "barang", label: "Alat Dipinjam" },
          { key: "masalah", label: "Jenis Masalah" },
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
          status: LOAN_STATUS_LABEL[l.status],
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
