import type { KeperluanType, KondisiPengembalian, LoanStatus } from "@prisma/client";

export const KEPERLUAN_LABEL: Record<KeperluanType, string> = {
  PRAKTIKUM: "Praktikum",
  RISET: "Riset",
  LAINNYA: "Kegiatan Lainnya",
};

export const KONDISI_LABEL: Record<KondisiPengembalian, string> = {
  SANGAT_BAIK: "Sangat Baik",
  BAIK: "Baik",
  KURANG_BAIK: "Kurang Baik",
  RUSAK_RINGAN: "Rusak Ringan",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
};

/** Conditions that don't require follow-up — everything else ("tidak baik") should be
 *  flagged (e.g. shown in red) wherever a return's condition is displayed. */
export const GOOD_RETURN_CONDITIONS: KondisiPengembalian[] = ["SANGAT_BAIK", "BAIK"];

/** Statuses where a loan is finished — no further staff action expected. Used to compute
 *  "riwayat" lists and active-loan counts consistently everywhere, instead of each page
 *  writing its own terminal-state list. */
export const TERMINAL_LOAN_STATUSES: LoanStatus[] = [
  "LABORAN_REJECTED",
  "HEAD_REJECTED",
  "RETURNED",
  "RETURNED_DAMAGED",
  "RETURNED_LOST",
  "COMPLETED",
  "CANCELLED",
];
