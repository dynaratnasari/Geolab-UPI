export const LAPORAN_TYPES = [
  { value: "inventaris", label: "Inventaris" },
  { value: "barang-rusak", label: "Barang Rusak" },
  { value: "barang-dipinjam", label: "Barang Dipinjam" },
  { value: "barang-hilang", label: "Barang Hilang" },
  { value: "maintenance", label: "Maintenance" },
  { value: "peminjaman-mahasiswa", label: "Peminjaman Mahasiswa" },
  { value: "praktikum", label: "Praktikum" },
] as const;

export type LaporanType = (typeof LAPORAN_TYPES)[number]["value"];

export interface LaporanColumn {
  key: string;
  label: string;
}

export interface LaporanResult {
  columns: LaporanColumn[];
  rows: Record<string, string | number>[];
}
