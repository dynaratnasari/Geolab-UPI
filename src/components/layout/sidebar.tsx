import { SidebarNav } from "./sidebar-nav";
import type { Profile } from "@prisma/client";

export function Sidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <SidebarNav profile={profile} />
    </aside>
  );
}
