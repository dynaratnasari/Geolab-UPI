// Demo login accounts — one per role, created as real Supabase Auth users (via
// the service-role admin API in seed.ts) so every role can be reviewed immediately.
// Password is the same for all four demo accounts; change it after first login.
export const DEMO_PASSWORD = "GeoLabUPI2026!";

export interface SeedUser {
  email: string;
  name: string;
  role: "KEPALA_LAB" | "DOSEN" | "LABORAN" | "MAHASISWA";
  nip?: string;
  nim?: string;
  prodi?: string;
}

export const DEMO_USERS: SeedUser[] = [
  {
    email: "muhammad.ihsan@upi.edu",
    name: "Dr. Ir. Muhammad Ihsan, S.T., M.T.",
    role: "KEPALA_LAB",
    nip: "920171219910528101",
    prodi: "Sains Informasi Geografi",
  },
  {
    // Also seeded as the primary lecturer on several real schedule rows (see jadwal.ts) —
    // logging in as this account shows a dosen with real courses assigned.
    email: "dosen@geolab.upi.edu",
    name: "Dr. Iwan Setiawan, S.Pd., M.Si.",
    role: "DOSEN",
    prodi: "S1 Pendidikan Geografi",
  },
  {
    email: "nusan_mpranata@upi.edu",
    name: "Nusan Mauli Pranata. S.Pd.",
    role: "LABORAN",
    prodi: "Sains Informasi Geografi",
  },
  {
    email: "mahasiswa@geolab.upi.edu",
    name: "Rani Kusuma Wardani",
    role: "MAHASISWA",
    nim: "2305123",
    prodi: "S1 Sains Informasi Geografi",
  },
];
