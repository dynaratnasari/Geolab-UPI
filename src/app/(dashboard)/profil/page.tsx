import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { ProfilForm } from "@/components/profil/profil-form";

export default async function ProfilPage() {
  const profile = await requireRole();

  const dosenWali = profile.dosenWaliId
    ? await prisma.profile.findUnique({ where: { id: profile.dosenWaliId }, select: { name: true } })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">{ROLE_LABELS[profile.role]} — {profile.email}</p>
      </div>
      <ProfilForm profile={profile} dosenWaliName={dosenWali?.name} />
    </div>
  );
}
