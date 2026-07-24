import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole();

  const dosenWali = profile.dosenWaliId
    ? await prisma.profile.findUnique({ where: { id: profile.dosenWaliId }, select: { name: true } })
    : null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar profile={profile} dosenWaliName={dosenWali?.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} dosenWaliName={dosenWali?.name} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
