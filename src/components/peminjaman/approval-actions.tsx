"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, PackageCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveKepalaLab, rejectKepalaLab, approveLaboranAwal, rejectLaboranAwal, serahTerima } from "@/lib/actions/approval";

type ApprovalStage = "LABORAN_AWAL" | "KEPALA_LAB" | "LABORAN";

const HANDLERS: Record<ApprovalStage, { approve: (id: string) => Promise<void>; reject?: (id: string, c: string) => Promise<void> }> = {
  LABORAN_AWAL: { approve: approveLaboranAwal, reject: rejectLaboranAwal },
  KEPALA_LAB: { approve: approveKepalaLab, reject: rejectKepalaLab },
  LABORAN: { approve: serahTerima },
};

export function ApprovalActions({ loanId, stage }: { loanId: string; stage: ApprovalStage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [catatan, setCatatan] = useState("");
  const handlers = HANDLERS[stage];

  function handleApprove() {
    startTransition(async () => {
      try {
        await handlers.approve(loanId);
        toast.success(stage === "LABORAN" ? "Barang berhasil diserahkan." : "Peminjaman disetujui.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses.");
      }
    });
  }

  function handleReject() {
    if (!handlers.reject) return;
    if (catatan.trim().length === 0) {
      toast.error("Catatan penolakan wajib diisi.");
      return;
    }
    startTransition(async () => {
      try {
        await handlers.reject!(loanId, catatan);
        toast.success("Peminjaman ditolak.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses.");
      }
    });
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2">
        <Input
          placeholder="Alasan penolakan..."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="h-8 w-48 text-xs"
        />
        <Button size="sm" variant="destructive" onClick={handleReject} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>
          Batal
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {handlers.reject && (
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setShowReject(true)} disabled={pending}>
          <X className="h-4 w-4" />
          Tolak
        </Button>
      )}
      <Button size="sm" className="bg-upi-700 hover:bg-upi-800" onClick={handleApprove} disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : stage === "LABORAN" ? (
          <PackageCheck className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {stage === "LABORAN" ? "Serah Terima" : "Setujui"}
      </Button>
    </div>
  );
}
