// Transcribed from "S1 Pend Geo_Jadwal Smt Ganjil 2025 - 2026.xlsx" — sheet "Jadwal",
// Program Studi Pendidikan Geografi S1, Semester Ganjil 2025/2026.
// Where a row lists co-lecturers, only the first (dosen utama) is linked as Schedule.dosen;
// all lecturer names are still seeded into DOSEN so they exist as Profile records.

export const DOSEN: string[] = [
  "Totok Doyo Pamungkas, S.Si., M.Eng.",
  "Silmi Afina Aliyan, S.T., M.T.",
  "Dr. Iwan Setiawan, S.Pd., M.Si.",
  "Hendro Murtianto, S.Pd., M.Sc.",
  "Prof. Dr. Enok Maryani, M.S.",
  "Dr. Bagja Waluya, S.Pd., M.Pd.",
  "Prof. Dr. Epon Ningrum, M.Pd.",
  "Prof. Dr. Ir. Dede Rohmat, M.T.",
  "Tiara Handayani, M.Sc.",
  "Prof. Dr. Mamat Ruhimat, M.Pd.",
  "Annisa Joviani Astari, M.I.L., M.Sc., Ph.D",
  "Zahara Sitta Iskandar, S.T., M.P.W.K.",
  "Dr. Lili Somantri, S.Pd., M.Si.",
  "Prof. Dr. Ahmad Yani, M.Si.",
  "Riko Arrasyid, S.Pd., M.Pd.",
  "Vini Agustiani Hadian, M.Pd.",
  "Dr. Acep Supriadi, M.Pd., MAP",
  "Dr. Nur Aedi, M.Pd.",
  "Prof. Dr. Dede Sugandi, M.Si.",
  "Dr. Nanin Trianawati Sugito, S.T., M.T.",
  "Drs. Asep Mulyadi, M.Pd.",
  "Rahayuni Tyas Pratiwi, S.Pd., M.Pd.",
  "Igna Juli Triana, S.Pd., M.Pd.",
];

export interface SeedSchedule {
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  kodeMk: string;
  dosenUtama: string;
  ruanganLabel: string;
  kelas: string;
  angkatan: number;
}

export const SCHEDULES: SeedSchedule[] = [
  { hari: "Senin", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG230", dosenUtama: "Totok Doyo Pamungkas, S.Si., M.Eng.", ruanganLabel: "R. 03 lt. IV", kelas: "1B", angkatan: 2025 },
  { hari: "Senin", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG217", dosenUtama: "Dr. Iwan Setiawan, S.Pd., M.Si.", ruanganLabel: "R. 16 lt. V", kelas: "1A", angkatan: 2025 },
  { hari: "Senin", jamMulai: "07.00", jamSelesai: "09.30", kodeMk: "GG219", dosenUtama: "Prof. Dr. Enok Maryani, M.S.", ruanganLabel: "R. 37 lt. VI", kelas: "3A", angkatan: 2024 },
  { hari: "Senin", jamMulai: "10.20", jamSelesai: "12.00", kodeMk: "GG441", dosenUtama: "Prof. Dr. Epon Ningrum, M.Pd.", ruanganLabel: "R. 03 lt. IV", kelas: "5B", angkatan: 2023 },
  { hari: "Senin", jamMulai: "09.30", jamSelesai: "12.00", kodeMk: "GG458", dosenUtama: "Prof. Dr. Ir. Dede Rohmat, M.T.", ruanganLabel: "R. 37 lt. VI", kelas: "3B", angkatan: 2024 },
  { hari: "Senin", jamMulai: "13.00", jamSelesai: "15.30", kodeMk: "GG311", dosenUtama: "Prof. Dr. Mamat Ruhimat, M.Pd.", ruanganLabel: "R. 03 lt. IV", kelas: "3B", angkatan: 2024 },
  { hari: "Senin", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG230", dosenUtama: "Totok Doyo Pamungkas, S.Si., M.Eng.", ruanganLabel: "R. 16 lt. V", kelas: "1A", angkatan: 2025 },
  { hari: "Senin", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG431", dosenUtama: "Annisa Joviani Astari, M.I.L., M.Sc., Ph.D", ruanganLabel: "R. 37 lt. VI", kelas: "5B", angkatan: 2023 },
  { hari: "Selasa", jamMulai: "07.00", jamSelesai: "09.30", kodeMk: "GG101", dosenUtama: "Prof. Dr. Enok Maryani, M.S.", ruanganLabel: "R. 03 lt. IV", kelas: "1B", angkatan: 2025 },
  { hari: "Selasa", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG430", dosenUtama: "Hendro Murtianto, S.Pd., M.Sc.", ruanganLabel: "R. 16 lt. V", kelas: "5A", angkatan: 2023 },
  { hari: "Selasa", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG461", dosenUtama: "Dr. Iwan Setiawan, S.Pd., M.Si.", ruanganLabel: "R. 37 lt. VI", kelas: "3A", angkatan: 2024 },
  { hari: "Selasa", jamMulai: "09.30", jamSelesai: "12.00", kodeMk: "GG216", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 03 lt. IV", kelas: "1B", angkatan: 2025 },
  { hari: "Selasa", jamMulai: "10.20", jamSelesai: "12.00", kodeMk: "GG441", dosenUtama: "Prof. Dr. Epon Ningrum, M.Pd.", ruanganLabel: "R. 16 lt. V", kelas: "5A", angkatan: 2023 },
  { hari: "Selasa", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG217", dosenUtama: "Dr. Iwan Setiawan, S.Pd., M.Si.", ruanganLabel: "R. 03 lt. IV", kelas: "1B", angkatan: 2025 },
  { hari: "Selasa", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG431", dosenUtama: "Annisa Joviani Astari, M.I.L., M.Sc., Ph.D", ruanganLabel: "R. 16 lt. V", kelas: "5A", angkatan: 2023 },
  { hari: "Selasa", jamMulai: "13.00", jamSelesai: "15.30", kodeMk: "GG311", dosenUtama: "Prof. Dr. Mamat Ruhimat, M.Pd.", ruanganLabel: "R. 37 lt. VI", kelas: "3A", angkatan: 2024 },
  { hari: "Rabu", jamMulai: "07.00", jamSelesai: "08.40", kodeMk: "KU105", dosenUtama: "Vini Agustiani Hadian, M.Pd.", ruanganLabel: "R. 25 lt. VI", kelas: "1A", angkatan: 2025 },
  { hari: "Rabu", jamMulai: "07.00", jamSelesai: "08.40", kodeMk: "KU110", dosenUtama: "Dr. Acep Supriadi, M.Pd., MAP", ruanganLabel: "R. 04 lt. V", kelas: "3A", angkatan: 2024 },
  { hari: "Rabu", jamMulai: "08.40", jamSelesai: "10.20", kodeMk: "KU105", dosenUtama: "Vini Agustiani Hadian, M.Pd.", ruanganLabel: "R. 26 lt. VI", kelas: "1B", angkatan: 2025 },
  { hari: "Rabu", jamMulai: "08.40", jamSelesai: "10.20", kodeMk: "DK302", dosenUtama: "Dr. Nur Aedi, M.Pd.", ruanganLabel: "R. 03 lt. IV", kelas: "3A", angkatan: 2024 },
  { hari: "Rabu", jamMulai: "10.20", jamSelesai: "12.00", kodeMk: "DK302", dosenUtama: "Dr. Nur Aedi, M.Pd.", ruanganLabel: "R. 4 lt. 4", kelas: "3B", angkatan: 2024 },
  { hari: "Rabu", jamMulai: "13.00", jamSelesai: "15.30", kodeMk: "GG216", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 16 lt. V", kelas: "1A", angkatan: 2025 },
  { hari: "Rabu", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG461", dosenUtama: "Dr. Iwan Setiawan, S.Pd., M.Si.", ruanganLabel: "R. 03 lt. IV", kelas: "3B", angkatan: 2024 },
  { hari: "Rabu", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG458", dosenUtama: "Prof. Dr. Ir. Dede Rohmat, M.T.", ruanganLabel: "R. 37 lt. VI", kelas: "3A", angkatan: 2024 },
  { hari: "Kamis", jamMulai: "07.00", jamSelesai: "09.30", kodeMk: "GG505", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 03 lt. IV", kelas: "3A", angkatan: 2024 },
  { hari: "Kamis", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG220", dosenUtama: "Prof. Dr. Dede Sugandi, M.Si.", ruanganLabel: "R. 16 lt. V", kelas: "1B", angkatan: 2025 },
  { hari: "Kamis", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG432", dosenUtama: "Hendro Murtianto, S.Pd., M.Sc.", ruanganLabel: "R. 37 lt. VI", kelas: "5A", angkatan: 2023 },
  { hari: "Kamis", jamMulai: "09.30", jamSelesai: "12.00", kodeMk: "GG219", dosenUtama: "Prof. Dr. Enok Maryani, M.S.", ruanganLabel: "R. 03 lt. IV", kelas: "3B", angkatan: 2024 },
  { hari: "Kamis", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG430", dosenUtama: "Hendro Murtianto, S.Pd., M.Sc.", ruanganLabel: "R. 16 lt. V", kelas: "5B", angkatan: 2023 },
  { hari: "Kamis", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "GG101", dosenUtama: "Prof. Dr. Enok Maryani, M.S.", ruanganLabel: "R. 37 lt. VI", kelas: "1A", angkatan: 2025 },
  { hari: "Jumat", jamMulai: "07.00", jamSelesai: "08.40", kodeMk: "DK303", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 11 lt. 4", kelas: "3A", angkatan: 2024 },
  { hari: "Jumat", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG432", dosenUtama: "Hendro Murtianto, S.Pd., M.Sc.", ruanganLabel: "R. 16 lt. V", kelas: "5B", angkatan: 2023 },
  { hari: "Jumat", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "GG220", dosenUtama: "Prof. Dr. Dede Sugandi, M.Si.", ruanganLabel: "R. 37 lt. VI", kelas: "1A", angkatan: 2025 },
  { hari: "Jumat", jamMulai: "07.00", jamSelesai: "10.20", kodeMk: "PT501", dosenUtama: "Prof. Dr. Epon Ningrum, M.Pd.", ruanganLabel: "R. Microteaching", kelas: "5A", angkatan: 2023 },
  { hari: "Jumat", jamMulai: "08.40", jamSelesai: "10.20", kodeMk: "DK303", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 11 lt. 4", kelas: "3B", angkatan: 2024 },
  { hari: "Jumat", jamMulai: "13.00", jamSelesai: "14.40", kodeMk: "KU110", dosenUtama: "Dr. Acep Supriadi, M.Pd., MAP", ruanganLabel: "R. 25 lt. V", kelas: "3B", angkatan: 2024 },
  { hari: "Jumat", jamMulai: "13.00", jamSelesai: "15.30", kodeMk: "GG505", dosenUtama: "Prof. Dr. Ahmad Yani, M.Si.", ruanganLabel: "R. 16 lt. V", kelas: "3A", angkatan: 2024 },
  { hari: "Jumat", jamMulai: "13.00", jamSelesai: "16.20", kodeMk: "PT501", dosenUtama: "Prof. Dr. Epon Ningrum, M.Pd.", ruanganLabel: "R. Microteaching", kelas: "5B", angkatan: 2023 },
];
