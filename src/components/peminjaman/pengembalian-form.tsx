"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prosesPengembalian } from "@/lib/actions/pengembalian";

export function PengembalianForm({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kondisi, setKondisi] = useState<"BAIK" | "RUSAK">("BAIK");
  const [catatan, setCatatan] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Proses Pengembalian
      </Button>
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await prosesPengembalian(loanId, kondisi, catatan || undefined);
        toast.success("Pengembalian berhasil diproses.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses pengembalian.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={kondisi}
        onChange={(e) => setKondisi(e.target.value as "BAIK" | "RUSAK")}
        className="h-8 w-32 rounded-lg border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="BAIK">Kondisi Baik</option>
        <option value="RUSAK">Rusak</option>
      </select>
      <Input
        placeholder="Catatan (opsional)"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        className="h-8 w-40 text-xs"
      />
      <Button size="sm" className="bg-upi-700 hover:bg-upi-800" onClick={handleSubmit} disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Konfirmasi
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Batal
      </Button>
    </div>
  );
}
