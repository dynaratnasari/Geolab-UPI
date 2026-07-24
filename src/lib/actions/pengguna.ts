"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema, updateProfileSchema, type CreateUserInput, type UpdateProfileInput } from "@/lib/validations/pengguna";
import type { Role } from "@prisma/client";

function parseAngkatan(value: string | undefined) {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

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
    data: {
      role: data.role,
      nip: data.nip,
      nim: data.nim,
      prodi: data.prodi,
      angkatan: parseAngkatan(data.angkatan),
      alamat: data.alamat,
      asalInstansi: data.asalInstansi,
      dosenWaliId: data.dosenWaliId || null,
    },
  });

  revalidatePath("/pengguna");
}

export async function updateUserRole(profileId: string, role: Role) {
  await requireRole("KEPALA_LAB");
  await prisma.profile.update({ where: { id: profileId }, data: { role } });
  revalidatePath("/pengguna");
}

/** Kepala Lab-only: fills in the extended profile fields (Angkatan, Alamat, Asal Instansi, Dosen
 *  Wali) shown in the sidebar profile card. Dosen Wali is assigned here rather than typed by the
 *  mahasiswa themselves, so the name always matches an existing Dosen profile exactly. */
export async function updateUserProfile(profileId: string, input: UpdateProfileInput) {
  await requireRole("KEPALA_LAB");
  const data = updateProfileSchema.parse(input);
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      nip: data.nip,
      nim: data.nim,
      prodi: data.prodi,
      angkatan: parseAngkatan(data.angkatan),
      alamat: data.alamat,
      asalInstansi: data.asalInstansi,
      dosenWaliId: data.dosenWaliId || null,
    },
  });
  revalidatePath("/pengguna");
  revalidatePath("/dashboard");
}
