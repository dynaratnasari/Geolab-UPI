"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelLoan } from "@/lib/actions/peminjaman";

export function CancelLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("Batalkan pengajuan peminjaman ini?")) return;
    startTransition(async () => {
      try {
        await cancelLoan(loanId);
        toast.success("Pengajuan dibatalkan.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal membatalkan pengajuan.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" className="text-destructive" onClick={handleCancel} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
      Batalkan Pengajuan
    </Button>
  );
}
