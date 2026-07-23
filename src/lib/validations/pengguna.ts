import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["KEPALA_LAB", "DOSEN", "LABORAN", "MAHASISWA"]),
  nim: z.string().optional(),
  nip: z.string().optional(),
  prodi: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
