import { z } from "zod";

// Numeric fields use plain z.number() (not z.coerce) so react-hook-form's zodResolver keeps a
// clean input type — the form registers them with { valueAsNumber: true }.

export const alatSchema = z.object({
  nama: z.string().min(3, "Nama alat minimal 3 karakter"),
  kodeInventaris: z.string().min(3, "Kode alat minimal 3 karakter").optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  merk: z.string().optional(),
  spesifikasi: z.string().optional(),
  jumlahTotal: z.number({ message: "Jumlah wajib diisi" }).int().min(1, "Jumlah minimal 1"),
  locationId: z.string().optional(),
  tipeAlat: z.enum(["TIPE_1", "TIPE_2", "TIPE_3"]),
  deskripsi: z.string().optional(),
  fotoUrl: z.string().optional(),
});

export type AlatInput = z.infer<typeof alatSchema>;

export const matkulSchema = z.object({
  kode: z.string().min(2, "Kode mata kuliah minimal 2 karakter"),
  nama: z.string().min(3, "Nama mata kuliah minimal 3 karakter"),
  sks: z.number({ message: "SKS wajib diisi" }).int().min(1, "SKS minimal 1").max(6, "SKS maksimal 6"),
  prodi: z.string().min(2, "Prodi wajib diisi"),
  menggunakanLab: z.boolean(),
});

export type MatkulInput = z.infer<typeof matkulSchema>;

export const dosenSchema = z.object({
  name: z.string().min(3, "Nama dosen minimal 3 karakter"),
  nip: z.string().optional(),
  nidn: z.string().optional(),
  prodi: z.string().optional(),
});

export type DosenInput = z.infer<typeof dosenSchema>;
