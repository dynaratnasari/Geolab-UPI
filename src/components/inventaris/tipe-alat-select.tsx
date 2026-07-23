"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTipeAlat } from "@/lib/actions/inventaris";
import { TIPE_ALAT_OPTIONS } from "@/lib/constants/inventaris";
import type { TipeAlat } from "@prisma/client";

export function TipeAlatSelect({ itemId, tipeAlat }: { itemId: string; tipeAlat: TipeAlat }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(next: TipeAlat) {
    setPending(true);
    try {
      await updateTipeAlat(itemId, next);
      toast.success("Tipe alat diperbarui.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui tipe alat.");
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={tipeAlat}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as TipeAlat)}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {TIPE_ALAT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
