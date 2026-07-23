"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/pengguna";
import type { Role } from "@prisma/client";

export async function createUser(input: CreateUserInput) {
  await requireRole("KEPALA_LAB");
  const data = createUserSchema.parse(input);

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name: data.name, nim: data.nim, prodi: data.prodi },
  });

  if (error || !created.user) {
    throw new Error(error?.message ?? "Gagal membuat akun pengguna.");
  }

  // The DB trigger auto-creates a profiles row defaulting role=MAHASISWA; patch it to the chosen role/fields.
  await prisma.profile.update({
    where: { id: created.user.id },
    data: { role: data.role, nip: data.nip, nim: data.nim, prodi: data.prodi },
  });

  revalidatePath("/pengguna");
}

export async function updateUserRole(profileId: string, role: Role) {
  await requireRole("KEPALA_LAB");
  await prisma.profile.update({ where: { id: profileId }, data: { role } });
  revalidatePath("/pengguna");
}
