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

export const loanFormFieldsSchema = z.object({
  jenisKeperluan: z.enum(["PRAKTIKUM", "RISET", "LAINNYA"], { message: "Pilih jenis keperluan" }),
  courseId: z.string().optional(),
  keperluan: z.string().optional(),
  tanggalPinjam: z.string().min(1, "Waktu pinjam wajib diisi"),
  tanggalKembali: z.string().min(1, "Waktu kembali wajib diisi"),
});

export type LoanFormFields = z.infer<typeof loanFormFieldsSchema>;

export const createLoanSchema = loanFormFieldsSchema
  .extend({
    items: z.array(loanItemSchema).min(1, "Pilih minimal 1 barang"),
    suratUrl: z.string().optional(),
  })
  .refine((data) => new Date(data.tanggalKembali) > new Date(data.tanggalPinjam), {
    message: "Waktu kembali harus setelah waktu pinjam",
    path: ["tanggalKembali"],
  })
  .refine((data) => data.items.every((i) => i.jumlah <= i.maksimal), {
    message: "Jumlah yang diminta melebihi stok tersedia",
    path: ["items"],
  })
  .refine((data) => data.jenisKeperluan !== "PRAKTIKUM" || (data.courseId?.trim().length ?? 0) > 0, {
    message: "Mata kuliah wajib dipilih",
    path: ["courseId"],
  })
  .refine((data) => data.jenisKeperluan !== "RISET" || (data.keperluan?.trim().length ?? 0) >= 3, {
    message: "Judul riset wajib diisi",
    path: ["keperluan"],
  })
  .refine((data) => data.jenisKeperluan !== "LAINNYA" || (data.keperluan?.trim().length ?? 0) >= 10, {
    message: "Jelaskan kegiatan minimal 10 karakter",
    path: ["keperluan"],
  });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
