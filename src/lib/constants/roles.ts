import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  KEPALA_LAB: "Kepala Laboratorium",
  DOSEN: "Dosen Penanggung Jawab",
  LABORAN: "Laboran / Admin Lab",
  MAHASISWA: "Mahasiswa",
};
