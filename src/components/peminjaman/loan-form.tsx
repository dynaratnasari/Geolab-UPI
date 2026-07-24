"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Loader2, ChevronDown, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createLoan } from "@/lib/actions/peminjaman";
import { loanFormFieldsSchema, KEPERLUAN_OPTIONS, type LoanFormFields } from "@/lib/validations/peminjaman";
import { createClient } from "@/lib/supabase/client";
import type { Course, InventoryItem, Kondisi } from "@prisma/client";

interface CartItem {
  itemId: string;
  nama: string;
  jumlah: number;
  maksimal: number;
  unitId?: string;
  kodeUnit?: string;
}

interface UnitOption {
  id: string;
  kodeUnit: string;
  kondisi: Kondisi;
}

/** Polls current availability for a cart line so the mahasiswa sees live status before submitting. */
function CartAvailabilityBadge({ itemId, unitId }: { itemId: string; unitId?: string }) {
  const { data } = useQuery({
    queryKey: unitId ? ["unit-status", itemId, unitId] : ["item-status", itemId],
    queryFn: async () => {
      if (unitId) {
        const res = await fetch(`/api/inventaris/${itemId}/units`);
        const json: { units: { id: string }[] } = await res.json();
        return { available: json.units.some((u) => u.id === unitId) };
      }
      const res = await fetch(`/api/inventaris/${itemId}/status`);
      const json: { jumlahTersedia: number } = await res.json();
      return { available: json.jumlahTersedia > 0 };
    },
    refetchInterval: 10000,
  });

  if (!data) return null;

  return data.available ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Tersedia
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Tidak Tersedia
    </span>
  );
}

export function LoanForm({ courses, dosenByCourseId }: { courses: Course[]; dosenByCourseId: Record<string, string> }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unitPickerItem, setUnitPickerItem] = useState<InventoryItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoanFormFields>({
    resolver: zodResolver(loanFormFieldsSchema),
  });

  const jenisKeperluan = watch("jenisKeperluan");
  const courseId = watch("courseId");
  const dosenPengampu = courseId ? (dosenByCourseId[courseId] ?? "Belum ada data dosen untuk mata kuliah ini") : "—";

  const { data: searchResults, isFetching } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ["inventaris-picker", query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, sort: "nama-asc", page: "1" });
      const res = await fetch(`/api/inventaris?${params.toString()}`);
      return res.json();
    },
    enabled: query.length > 0 && !unitPickerItem,
  });

  const { data: unitData, isFetching: isFetchingUnits } = useQuery<{ units: UnitOption[] }>({
    queryKey: ["inventaris-units", unitPickerItem?.id],
    queryFn: async () => {
      const res = await fetch(`/api/inventaris/${unitPickerItem!.id}/units`);
      return res.json();
    },
    enabled: !!unitPickerItem,
  });

  const availableResults = useMemo(
    () =>
      (searchResults?.items ?? []).filter((i) => {
        if (i.jumlahTersedia <= 0) return false;
        // Tipe 1 lines are quantity-based, so the same item can only appear once in the cart.
        if (i.tipeAlat === "TIPE_1") return !cart.some((c) => c.itemId === i.id);
        return true;
      }),
    [searchResults, cart],
  );

  const availableUnits = useMemo(
    () => (unitData?.units ?? []).filter((u) => !cart.some((c) => c.unitId === u.id)),
    [unitData, cart],
  );

  function closePicker() {
    setPickerOpen(false);
    setQuery("");
    setUnitPickerItem(null);
  }

  function pickItem(item: InventoryItem) {
    if (item.tipeAlat === "TIPE_1") {
      setCart((prev) => [...prev, { itemId: item.id, nama: item.nama, jumlah: 1, maksimal: item.jumlahTersedia }]);
      closePicker();
    } else {
      setUnitPickerItem(item);
    }
  }

  function pickUnit(unit: UnitOption) {
    if (!unitPickerItem) return;
    setCart((prev) => [
      ...prev,
      { itemId: unitPickerItem.id, nama: unitPickerItem.nama, jumlah: 1, maksimal: 1, unitId: unit.id, kodeUnit: unit.kodeUnit },
    ]);
    closePicker();
  }

  function updateJumlah(itemId: string, jumlah: number) {
    setCart((prev) => prev.map((c) => (c.itemId === itemId && !c.unitId ? { ...c, jumlah: Math.max(1, Math.min(jumlah, c.maksimal)) } : c)));
  }

  function removeFromCart(target: CartItem) {
    setCart((prev) => prev.filter((c) => (target.unitId ? c.unitId !== target.unitId : c.itemId !== target.itemId)));
  }

  async function onSubmit(values: LoanFormFields) {
    setFormError(null);
    if (cart.length === 0) {
      setFormError("Pilih minimal 1 barang untuk dipinjam.");
      return;
    }
    setSubmitting(true);
    try {
      let suratUrl: string | undefined;
      if (file) {
        const supabase = createClient();
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("peminjaman").upload(path, file);
        if (error) throw new Error(`Gagal mengunggah surat: ${error.message}`);
        suratUrl = supabase.storage.from("peminjaman").getPublicUrl(path).data.publicUrl;
      }

      const result = await createLoan({ ...values, items: cart, suratUrl });
      toast.success("Peminjaman berhasil diajukan.");
      router.push(`/peminjaman/${result.loanId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengajukan peminjaman.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="shadow-soft">
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="jenisKeperluan">Keperluan</Label>
            <div className="relative">
              <select
                id="jenisKeperluan"
                {...register("jenisKeperluan")}
                defaultValue=""
                className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Pilih keperluan
                </option>
                {KEPERLUAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.jenisKeperluan && <p className="text-xs text-destructive">{errors.jenisKeperluan.message}</p>}
          </div>

          {jenisKeperluan === "PRAKTIKUM" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="courseId">Mata Kuliah</Label>
                <div className="relative">
                  <select
                    id="courseId"
                    {...register("courseId")}
                    defaultValue=""
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      Pilih mata kuliah
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.courseId && <p className="text-xs text-destructive">{errors.courseId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Dosen Pengampu</Label>
                <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
                  {dosenPengampu}
                </div>
              </div>
            </>
          )}

          {jenisKeperluan === "RISET" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="keperluan">Judul Riset</Label>
              <Input id="keperluan" {...register("keperluan")} placeholder="Judul penelitian/riset Anda" />
              {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
            </div>
          )}

          {jenisKeperluan === "LAINNYA" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="keperluan">Jelaskan Kegiatan</Label>
              <textarea
                id="keperluan"
                {...register("keperluan")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Jelaskan kegiatan yang memerlukan peminjaman alat ini"
              />
              {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tanggalPinjam">Waktu Pinjam</Label>
            <Input id="tanggalPinjam" type="datetime-local" {...register("tanggalPinjam")} />
            {errors.tanggalPinjam && <p className="text-xs text-destructive">{errors.tanggalPinjam.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalKembali">Waktu Kembali</Label>
            <Input id="tanggalKembali" type="datetime-local" {...register("tanggalKembali")} />
            {errors.tanggalKembali && <p className="text-xs text-destructive">{errors.tanggalKembali.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="surat">Upload Surat (opsional)</Label>
            <Input id="surat" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <Label>Daftar Barang</Label>
            {!pickerOpen && (
              <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                Tambah Barang
              </Button>
            )}
          </div>

          {pickerOpen && (
            <div className="rounded-lg border border-border p-3">
              {unitPickerItem ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setUnitPickerItem(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali cari barang
                  </button>
                  <p className="text-sm font-medium text-foreground">
                    Pilih unit — {unitPickerItem.nama}
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                    {isFetchingUnits ? (
                      <p className="p-3 text-sm text-muted-foreground">Memuat unit...</p>
                    ) : availableUnits.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Tidak ada unit tersedia untuk barang ini.</p>
                    ) : (
                      availableUnits.map((unit) => (
                        <button
                          type="button"
                          key={unit.id}
                          onClick={() => pickUnit(unit)}
                          className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                        >
                          <span className="font-mono">{unit.kodeUnit}</span>
                          <span className="text-xs text-muted-foreground">{unit.kondisi.replace("_", " ")}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Cari nama barang atau kode..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query.length > 0 && (
                    <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-card">
                      {isFetching ? (
                        <p className="p-3 text-sm text-muted-foreground">Mencari...</p>
                      ) : availableResults.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">Tidak ada barang tersedia yang cocok.</p>
                      ) : (
                        availableResults.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => pickItem(item)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span>{item.nama}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.tipeAlat === "TIPE_1" ? `${item.jumlahTersedia} tersedia` : "pilih unit →"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada barang dipilih.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((c) => (
                <li key={c.unitId ?? c.itemId} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nama}</p>
                    {c.kodeUnit && <p className="font-mono text-xs text-muted-foreground">{c.kodeUnit}</p>}
                  </div>
                  {c.unitId ? (
                    <span className="shrink-0 text-xs text-muted-foreground">1 unit</span>
                  ) : (
                    <>
                      <Input
                        type="number"
                        min={1}
                        max={c.maksimal}
                        value={c.jumlah}
                        onChange={(e) => updateJumlah(c.itemId, Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">/ {c.maksimal}</span>
                    </>
                  )}
                  <CartAvailabilityBadge itemId={c.itemId} unitId={c.unitId} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFromCart(c)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Ajukan Peminjaman
        </Button>
      </div>
    </form>
  );
}
