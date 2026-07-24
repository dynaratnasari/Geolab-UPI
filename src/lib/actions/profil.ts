"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { myProfileSchema, type MyProfileInput } from "@/lib/validations/pengguna";

function parseAngkatan(value: string | undefined) {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

/** Self-service profile update ("Profil Saya") — any logged-in user editing their own record.
 *  Deliberately has no dosenWaliId param: only Kepala Lab can assign that (see updateUserProfile
 *  in actions/pengguna.ts), so it can never be set here regardless of what's passed in. */
export async function updateMyProfile(input: MyProfileInput) {
  const profile = await requireRole();
  const data = myProfileSchema.parse(input);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      nip: data.nip,
      nim: data.nim,
      prodi: data.prodi,
      angkatan: parseAngkatan(data.angkatan),
      alamat: data.alamat,
      asalInstansi: data.asalInstansi,
      avatarUrl: data.avatarUrl,
    },
  });

  revalidatePath("/profil");
  revalidatePath("/dashboard");
}
