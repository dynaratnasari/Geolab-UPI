"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import type { Role } from "@prisma/client";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground md:hidden" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="w-64 p-0 sm:max-w-64">
        <SheetTitle className="sr-only">Navigasi</SheetTitle>
        <SidebarNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
