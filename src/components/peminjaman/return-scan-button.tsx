"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmReturnScan } from "@/lib/actions/pengembalian";

/** BORROWED/OVERDUE stage — marks the physical handback as having happened, distinct from
 *  the inspection form that follows once status moves to RETURN_PENDING_INSPECTION. */
export function ReturnScanButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await confirmReturnScan(loanId);
        toast.success("Pengembalian tercatat — lengkapi pemeriksaan kondisi.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses pengembalian.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
      Proses Pengembalian
    </Button>
  );
}
