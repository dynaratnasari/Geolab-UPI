import { z } from "zod";

export const loanItemSchema = z.object({
  itemId: z.string().min(1),
  nama: z.string(),
  jumlah: z.number().int().min(1),
  maksimal: z.number().int(),
  unitId: z.string().optional(),
  kodeUnit: z.string().optional(),
});

export const KEPERLUAN_OPTIONS = [
  { value: "PRAKTIKUM", label: "Praktikum" },
  { value: "RISET", label: "Riset" },
  { value: "LAINNYA", label: "Kegiatan Lainnya" },
] as const;

export const JAM_SLOTS = [
  "07.00 - 08.00",
  "08.00 - 09.00",
  "09.00 - 10.00",
  "10.00 - 11.00",
  "11.00 - 12.00",
  "12.00 - 13.00",
  "13.00 - 14.00",
  "14.00 - 15.00",
  "15.00 - 16.00",
  "16.00 - 17.00",
] as const;

export const loanFormFieldsSchema = z.object({
  courseId: z.string().min(1, "Mata kuliah wajib dipilih"),
  tanggalPinjam: z.string().min(1, "Tanggal pinjam wajib diisi"),
  tanggalKembali: z.string().min(1, "Tanggal kembali wajib diisi"),
  jam: z.enum(JAM_SLOTS, { message: "Pilih jam penggunaan" }),
  jenisKeperluan: z.enum(["PRAKTIKUM", "RISET", "LAINNYA"], { message: "Pilih jenis keperluan" }),
  keperluan: z.string().optional(),
});

export type LoanFormFields = z.infer<typeof loanFormFieldsSchema>;

export const createLoanSchema = loanFormFieldsSchema
  .extend({
    items: z.array(loanItemSchema).min(1, "Pilih minimal 1 barang"),
    suratUrl: z.string().optional(),
  })
  .refine((data) => new Date(data.tanggalKembali) >= new Date(data.tanggalPinjam), {
    message: "Tanggal kembali tidak boleh sebelum tanggal pinjam",
    path: ["tanggalKembali"],
  })
  .refine((data) => data.items.every((i) => i.jumlah <= i.maksimal), {
    message: "Jumlah yang diminta melebihi stok tersedia",
    path: ["items"],
  })
  .refine((data) => data.jenisKeperluan !== "LAINNYA" || (data.keperluan?.trim().length ?? 0) >= 10, {
    message: "Jelaskan kegiatan minimal 10 karakter",
    path: ["keperluan"],
  });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
