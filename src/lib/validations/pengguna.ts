import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["KEPALA_LAB", "DOSEN", "LABORAN", "MAHASISWA"]),
  nim: z.string().optional(),
  nip: z.string().optional(),
  prodi: z.string().optional(),
  angkatan: z.string().optional(),
  alamat: z.string().optional(),
  asalInstansi: z.string().optional(),
  dosenWaliId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateProfileSchema = z.object({
  nim: z.string().optional(),
  nip: z.string().optional(),
  prodi: z.string().optional(),
  angkatan: z.string().optional(),
  alamat: z.string().optional(),
  asalInstansi: z.string().optional(),
  dosenWaliId: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Self-service version for "Profil Saya" — deliberately excludes dosenWaliId; only Kepala Lab
 *  can assign that (see updateProfileSchema), so a mahasiswa can't set it on themselves. */
export const myProfileSchema = z.object({
  nim: z.string().optional(),
  nip: z.string().optional(),
  prodi: z.string().optional(),
  angkatan: z.string().optional(),
  alamat: z.string().optional(),
  asalInstansi: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type MyProfileInput = z.infer<typeof myProfileSchema>;
