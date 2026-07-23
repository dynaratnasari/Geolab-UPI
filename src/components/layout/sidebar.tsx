import { SidebarNav } from "./sidebar-nav";
import type { Role } from "@prisma/client";

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <SidebarNav role={role} />
    </aside>
  );
}
