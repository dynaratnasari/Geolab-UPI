// Transcribed from "S1 Pend Geo_Jadwal Smt Ganjil 2025 - 2026.xlsx" — sheet "DAFTAR MK",
// Program Studi Pendidikan Geografi, Semester Ganjil 2025/2026.
export interface SeedCourse {
  kode: string;
  nama: string;
  sks: number;
  prodi: string;
  /** Only courses that plausibly use physical lab/field equipment appear in the Peminjaman
   *  form's course picker — general/national courses (Kewarganegaraan, Pancasila) and purely
   *  theoretical/pedagogy courses (kurikulum, metode penelitian, dst.) do not. */
  menggunakanLab: boolean;
}

const PRODI = "S1 Pendidikan Geografi";

export const COURSES: SeedCourse[] = [
  // Semester 1 (Angkatan 2025)
  { kode: "KU105", nama: "Pendidikan Kewarganegaraan", sks: 2, prodi: PRODI, menggunakanLab: false },
  { kode: "GG216", nama: "Oseanografi", sks: 3, prodi: PRODI, menggunakanLab: true },
  { kode: "GG230", nama: "Dinamika Bumi", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG217", nama: "Perubahan Iklim dan Pemanasan Global", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG220", nama: "Kartografi dan Desain Peta", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG101", nama: "Pengantar Geografi dan Isu Global", sks: 3, prodi: PRODI, menggunakanLab: false },
  // Semester 3 (Angkatan 2024)
  { kode: "KU110", nama: "Pendidikan Pancasila", sks: 2, prodi: PRODI, menggunakanLab: false },
  { kode: "DK303", nama: "Kurikulum dan Pembelajaran", sks: 2, prodi: PRODI, menggunakanLab: false },
  { kode: "DK302", nama: "Pengelolaan Kelas", sks: 2, prodi: PRODI, menggunakanLab: false },
  { kode: "GG458", nama: "Geografi Tanah dan Pertanian", sks: 3, prodi: PRODI, menggunakanLab: true },
  { kode: "GG219", nama: "Geografi Ekonomi dan Pembangunan", sks: 3, prodi: PRODI, menggunakanLab: false },
  { kode: "GG311", nama: "Dinamika Penduduk", sks: 3, prodi: PRODI, menggunakanLab: false },
  { kode: "GG505", nama: "Telaah Kurikulum Bidang Studi Geografi", sks: 3, prodi: PRODI, menggunakanLab: false },
  { kode: "GG461", nama: "Sistem Informasi Geografis", sks: 4, prodi: PRODI, menggunakanLab: true },
  // Semester 5 (Angkatan 2023)
  { kode: "PT501", nama: "Microteaching", sks: 4, prodi: PRODI, menggunakanLab: false },
  { kode: "GG431", nama: "Analisis Mengenai Dampak Lingkungan", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG432", nama: "Geomorfologi Terapan dan Survey Sumber Daya", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG441", nama: "Metode Penelitian Pendidikan Geografi", sks: 2, prodi: PRODI, menggunakanLab: false },
  { kode: "GG430", nama: "Konservasi dan Rehabilitasi Lahan", sks: 4, prodi: PRODI, menggunakanLab: true },
  { kode: "GG420", nama: "Pengembangan Alat Peraga Geografi", sks: 4, prodi: PRODI, menggunakanLab: true },
];
