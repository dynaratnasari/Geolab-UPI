"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Camera, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { submitInspection } from "@/lib/actions/pengembalian";
import { JAM_SLOTS } from "@/lib/validations/peminjaman";
import type { KondisiPengembalian } from "@prisma/client";

const KONDISI_OPTIONS: { value: KondisiPengembalian; label: string }[] = [
  { value: "SANGAT_BAIK", label: "Sangat Baik" },
  { value: "BAIK", label: "Baik" },
  { value: "KURANG_BAIK", label: "Kurang Baik" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_BERAT", label: "Rusak Berat" },
  { value: "HILANG", label: "Hilang" },
];

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function nearestJamSlot() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }).format(new Date()));
  const slot = JAM_SLOTS.find((s) => Number(s.split(".")[0]) >= hour);
  return slot ?? JAM_SLOTS[JAM_SLOTS.length - 1];
}

/** Only rendered once status is RETURN_PENDING_INSPECTION — the "Proses Pengembalian" step
 *  before this (BORROWED/OVERDUE) is a separate button, see ReturnScanButton. */
export function InspectionForm({ loanId, pemeriksaDefaultNama }: { loanId: string; pemeriksaDefaultNama: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kondisi, setKondisi] = useState<KondisiPengembalian>("BAIK");
  const [pemeriksaNama, setPemeriksaNama] = useState(pemeriksaDefaultNama);
  const [tanggal, setTanggal] = useState(todayIso());
  const [jam, setJam] = useState<(typeof JAM_SLOTS)[number]>(nearestJamSlot());
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
    if (!pemeriksaNama.trim()) {
      toast.error("Nama pemeriksa wajib diisi.");
      return;
    }
    if (!catatan.trim()) {
      toast.error("Catatan wajib diisi.");
      return;
    }
    if (!fotoUrl) {
      toast.error("Foto kondisi barang wajib diunggah.");
      return;
    }
    const tanggalJam = new Date(`${tanggal}T${jam.replace(".", ":")}:00`);
    startTransition(async () => {
      try {
        await submitInspection(loanId, kondisi, pemeriksaNama.trim(), tanggalJam, catatan.trim(), fotoUrl);
        toast.success("Pengembalian berhasil diproses.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memproses pengembalian.");
      }
    });
  }

  return (
    <div className="w-full max-w-sm space-y-2.5 rounded-lg border border-border bg-background p-3">
      <div className="space-y-1">
        <Label htmlFor="pemeriksaNama" className="text-xs">
          Nama Pemeriksa
        </Label>
        <Input
          id="pemeriksaNama"
          value={pemeriksaNama}
          onChange={(e) => setPemeriksaNama(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="tanggalPeriksa" className="text-xs">
            Tanggal
          </Label>
          <Input
            id="tanggalPeriksa"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="jamPeriksa" className="text-xs">
            Jam
          </Label>
          <div className="relative">
            <select
              id="jamPeriksa"
              value={jam}
              onChange={(e) => setJam(e.target.value as (typeof JAM_SLOTS)[number])}
              className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2 pr-7 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {JAM_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="kondisiBarang" className="text-xs">
          Kondisi Barang
        </Label>
        <select
          id="kondisiBarang"
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
      </div>

      <div className="space-y-1">
        <Label htmlFor="catatanPeriksa" className="text-xs">
          Catatan
        </Label>
        <Input
          id="catatanPeriksa"
          placeholder="Catatan kondisi barang..."
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <label className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-input px-2 text-xs text-muted-foreground hover:bg-muted">
        <Camera className="h-3.5 w-3.5" />
        {uploading ? "Mengunggah..." : fotoUrl ? "Foto terunggah — ganti?" : "Unggah foto kondisi (wajib)"}
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
