import type { TipeAlat } from "@prisma/client";

export const TIPE_ALAT_LABEL: Record<TipeAlat, string> = {
  TIPE_1: "Tipe Alat 1 — Risiko Rendah",
  TIPE_2: "Tipe Alat 2 — Risiko Sedang",
  TIPE_3: "Tipe Alat 3 — Risiko Tinggi",
};

export const TIPE_ALAT_OPTIONS: { value: TipeAlat; label: string }[] = [
  { value: "TIPE_1", label: "Tipe Alat 1 — Risiko Rendah" },
  { value: "TIPE_2", label: "Tipe Alat 2 — Risiko Sedang" },
  { value: "TIPE_3", label: "Tipe Alat 3 — Risiko Tinggi" },
];
