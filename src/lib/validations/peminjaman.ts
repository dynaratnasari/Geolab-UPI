import { z } from "zod";

export const loanItemSchema = z.object({
  itemId: z.string().min(1),
  nama: z.string(),
  jumlah: z.number().int().min(1),
  maksimal: z.number().int(),
});

export const loanFormFieldsSchema = z.object({
  courseId: z.string().min(1, "Mata kuliah wajib dipilih"),
  dosenPengampu: z.string().min(3, "Nama dosen pengampu wajib diisi"),
  tanggalPinjam: z.string().min(1, "Tanggal pinjam wajib diisi"),
  tanggalKembali: z.string().min(1, "Tanggal kembali wajib diisi"),
  jam: z.string().min(1, "Jam wajib diisi"),
  keperluan: z.string().min(10, "Jelaskan keperluan minimal 10 karakter"),
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
  });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
