"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
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
      name: data.name,
      kategoriPengguna: data.kategoriPengguna,
      nip: data.nip,
      nim: data.nim,
      nidn: data.nidn,
      prodi: data.prodi,
      angkatan: parseAngkatan(data.angkatan),
      alamat: data.alamat,
      asalInstansi: data.asalInstansi,
      alamatInstansi: data.alamatInstansi,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      ktpUrl: data.ktpUrl,
    },
  });

  revalidatePath("/profil");
  revalidatePath("/dashboard");
}

/** KTP lives in a private bucket (it contains NIK + personal data), so the owner needs a
 *  short-lived signed URL to preview what they uploaded rather than a public link. */
export async function getMyKtpPreviewUrl() {
  const profile = await requireRole();
  if (!profile.ktpUrl) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(profile.ktpUrl, 60 * 5);
  if (error) return null;
  return data.signedUrl;
}
