import type { KeperluanType } from "@prisma/client";

export const KEPERLUAN_LABEL: Record<KeperluanType, string> = {
  PRAKTIKUM: "Praktikum",
  RISET: "Riset",
  LAINNYA: "Kegiatan Lainnya",
};
