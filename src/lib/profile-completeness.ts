import type { Profile } from "@prisma/client";

/** Checks the same fields the "Profil Saya" form asks a Mahasiswa to fill in — everything
 *  except foto, which stays optional. Used both server-side (createLoan, defense-in-depth)
 *  and client-side (loan-form.tsx, to gate the submit button before the user even tries). */
export function isMahasiswaProfileComplete(
  profile: Pick<Profile, "kategoriPengguna" | "nim" | "prodi" | "angkatan" | "phone" | "alamat">,
): boolean {
  return (
    profile.kategoriPengguna === "MAHASISWA" &&
    Boolean(profile.nim?.trim()) &&
    Boolean(profile.prodi?.trim()) &&
    profile.angkatan != null &&
    Boolean(profile.phone?.trim()) &&
    Boolean(profile.alamat?.trim())
  );
}
