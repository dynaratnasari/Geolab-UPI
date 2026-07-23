import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Role, Profile } from "@prisma/client";

export { ROLE_LABELS } from "@/lib/constants/roles";

/** Cached per-request: current authenticated user's Profile row, or null if signed out. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.profile.findUnique({ where: { id: user.id } });
});

/** Redirects to /login if signed out, or /dashboard if signed in but lacking one of `roles`. */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (roles.length > 0 && !roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}
