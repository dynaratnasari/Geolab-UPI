"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { submitInspection } from "@/lib/actions/pengembalian";
import type { KondisiPengembalian } from "@prisma/client";

const KONDISI_OPTIONS: { value: KondisiPengembalian; label: string }[] = [
  { value: "SANGAT_BAIK", label: "Sangat Baik" },
  { value: "BAIK", label: "Baik" },
  { value: "KURANG_BAIK", label: "Kurang Baik" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_BERAT", label: "Rusak Berat" },
  { value: "HILANG", label: "Hilang" },
];

export function PengembalianForm({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kondisi, setKondisi] = useState<KondisiPengembalian>("BAIK");
  const [catatan, setCatatan] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Proses Pengembalian
      </Button>
    );
  }

  async function handlePhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `pengembalian/${loanId}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("peminjaman").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      setFotoUrl(supabase.storage.from("peminjaman").getPublicUrl(path).data.publicUrl);
      toast.success("Foto kondisi berhasil diunggah.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await submitInspection(loanId, kondisi, catatan || undefined, fotoUrl ?? undefined);
        toast.success("Pengembalian berhasil diproses.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses pengembalian.");
      }
    });
  }

  const now = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <div className="w-full max-w-sm space-y-2 rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">Diperiksa pada {now}</p>
      <select
        value={kondisi}
        onChange={(e) => setKondisi(e.target.value as KondisiPengembalian)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {KONDISI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Input placeholder="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="h-8 text-xs" />
      <label className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-input px-2 text-xs text-muted-foreground hover:bg-muted">
        <Camera className="h-3.5 w-3.5" />
        {uploading ? "Mengunggah..." : fotoUrl ? "Foto terunggah — ganti?" : "Unggah foto kondisi (opsional)"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="bg-upi-700 hover:bg-upi-800" onClick={handleSubmit} disabled={pending || uploading}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Konfirmasi
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </div>
  );
}
