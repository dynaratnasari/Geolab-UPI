import type { KeperluanType, LoanStatus } from "@prisma/client";

export const KEPERLUAN_LABEL: Record<KeperluanType, string> = {
  PRAKTIKUM: "Praktikum",
  RISET: "Riset",
  LAINNYA: "Kegiatan Lainnya",
};

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
