"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Loader2, ChevronDown, Plus, ImageOff, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createLoan } from "@/lib/actions/peminjaman";
import { loanFormFieldsSchema, KEPERLUAN_OPTIONS, JAM_SLOTS, type LoanFormFields } from "@/lib/validations/peminjaman";
import { createClient } from "@/lib/supabase/client";
import { PilihAlatSheet, type PickerItem, type UnitOption } from "@/components/peminjaman/pilih-alat-sheet";
import type { Course } from "@prisma/client";

interface CartItem {
  itemId: string;
  nama: string;
  jumlah: number;
  maksimal: number;
  unitId?: string;
  kodeUnit?: string;
  fotoUrl?: string | null;
  categoryNama?: string;
}

function AlatThumbnail({ src, size = "md" }: { src?: string | null; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  if (!src) {
    return (
      <div className={`${dims} flex shrink-0 items-center justify-center rounded-md border border-border bg-upi-50`}>
        <ImageOff className="h-3.5 w-3.5 text-upi-300" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${dims} shrink-0 rounded-md border border-border bg-white object-contain p-0.5`}
    />
  );
}

function RequiredHint() {
  return <span className="ml-1 text-xs font-normal text-blue-600">(wajib diisi)</span>;
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

interface DosenOption {
  id: string;
  name: string;
  prodi: string | null;
}

interface CategoryOption {
  id: string;
  nama: string;
}

export function LoanForm({
  courses,
  dosenByCourseId,
  dosenList,
  categories,
}: {
  courses: Course[];
  dosenByCourseId: Record<string, string>;
  dosenList: DosenOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dosenQuery, setDosenQuery] = useState("");
  const [dosenPickerOpen, setDosenPickerOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormFields>({
    resolver: zodResolver(loanFormFieldsSchema),
  });

  const jenisKeperluan = watch("jenisKeperluan");
  const courseId = watch("courseId");
  const dosenPengampu = courseId ? (dosenByCourseId[courseId] ?? "Belum ada data dosen untuk mata kuliah ini") : "—";

  const dosenPembimbingId = watch("dosenPembimbingId");
  const selectedDosen = dosenList.find((d) => d.id === dosenPembimbingId);
  const filteredDosen = useMemo(
    () => dosenList.filter((d) => d.name.toLowerCase().includes(dosenQuery.toLowerCase())),
    [dosenList, dosenQuery],
  );

  const keperluanText = watch("keperluan");
  const lokasi = watch("lokasi");
  const tanggalPinjamValue = watch("tanggalPinjam");
  const jamPinjamValue = watch("jamPinjam");
  const tanggalKembaliValue = watch("tanggalKembali");
  const jamKembaliValue = watch("jamKembali");

  // Mirrors createLoanSchema's refine() rules so the submit button reflects readiness live,
  // instead of only surfacing errors after a failed submit attempt.
  const requiredFieldsFilled = useMemo(() => {
    if (!jenisKeperluan || !tanggalPinjamValue || !jamPinjamValue || !tanggalKembaliValue || !jamKembaliValue) return false;
    if (jenisKeperluan === "PRAKTIKUM") return Boolean(courseId);
    if (jenisKeperluan === "RISET") {
      return (keperluanText?.trim().length ?? 0) >= 3 && Boolean(dosenPembimbingId) && (lokasi?.trim().length ?? 0) >= 3;
    }
    if (jenisKeperluan === "LAINNYA") {
      return (keperluanText?.trim().length ?? 0) >= 10 && (lokasi?.trim().length ?? 0) >= 3;
    }
    return false;
  }, [jenisKeperluan, tanggalPinjamValue, jamPinjamValue, tanggalKembaliValue, jamKembaliValue, courseId, keperluanText, dosenPembimbingId, lokasi]);

  const canSubmit = requiredFieldsFilled && cart.length > 0;

  // Most loans return the same day they're picked up — default Tanggal Kembali to match Tanggal
  // Pinjam, but stop auto-syncing once the mahasiswa manually picks a different return date.
  const [kembaliTouched, setKembaliTouched] = useState(false);
  const tanggalPinjamField = register("tanggalPinjam");
  const tanggalKembaliField = register("tanggalKembali");

  const excludeUnitIds = useMemo(() => cart.map((c) => c.unitId).filter((id): id is string => Boolean(id)), [cart]);

  function pickItem(item: PickerItem) {
    if (cart.some((c) => c.itemId === item.id && !c.unitId)) {
      toast.error("Alat ini sudah ada di daftar barang.");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        itemId: item.id,
        nama: item.nama,
        jumlah: 1,
        maksimal: item.jumlahTersedia,
        fotoUrl: item.fotoUrl,
        categoryNama: item.category.nama,
      },
    ]);
    setPickerOpen(false);
  }

  function pickUnit(item: PickerItem, unit: UnitOption) {
    setCart((prev) => [
      ...prev,
      {
        itemId: item.id,
        nama: item.nama,
        jumlah: 1,
        maksimal: 1,
        unitId: unit.id,
        kodeUnit: unit.kodeUnit,
        fotoUrl: item.fotoUrl,
        categoryNama: item.category.nama,
      },
    ]);
    setPickerOpen(false);
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
                <Label htmlFor="courseId">
                  Mata Kuliah
                  <RequiredHint />
                </Label>
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
            <>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="keperluan">
                  Judul Riset
                  <RequiredHint />
                </Label>
                <Input id="keperluan" {...register("keperluan")} placeholder="Judul penelitian/riset Anda" />
                {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dosenPembimbingSearch">
                  Dosen Pembimbing
                  <RequiredHint />
                </Label>
                <input type="hidden" {...register("dosenPembimbingId")} />
                {selectedDosen && !dosenPickerOpen ? (
                  <div className="flex h-9 items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm">
                    <span className="truncate">{selectedDosen.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDosenPickerOpen(true);
                        setDosenQuery("");
                      }}
                      className="shrink-0 text-xs text-upi-700 hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="dosenPembimbingSearch"
                      autoComplete="off"
                      placeholder="Cari nama dosen..."
                      className="pl-9"
                      value={dosenQuery}
                      onChange={(e) => {
                        setDosenQuery(e.target.value);
                        setDosenPickerOpen(true);
                      }}
                      onFocus={() => setDosenPickerOpen(true)}
                    />
                    {dosenPickerOpen && (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-card">
                        {filteredDosen.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">Tidak ada dosen yang cocok.</p>
                        ) : (
                          filteredDosen.map((d) => (
                            <button
                              type="button"
                              key={d.id}
                              onClick={() => {
                                setValue("dosenPembimbingId", d.id, { shouldValidate: true });
                                setDosenPickerOpen(false);
                                setDosenQuery("");
                              }}
                              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                            >
                              <span>{d.name}</span>
                              {d.prodi && <span className="text-xs text-muted-foreground">{d.prodi}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                {errors.dosenPembimbingId && <p className="text-xs text-destructive">{errors.dosenPembimbingId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lokasi">
                  Lokasi
                  <RequiredHint />
                </Label>
                <Input id="lokasi" {...register("lokasi")} placeholder="Lokasi penelitian/riset" />
                {errors.lokasi && <p className="text-xs text-destructive">{errors.lokasi.message}</p>}
              </div>
            </>
          )}

          {jenisKeperluan === "LAINNYA" && (
            <>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="keperluan">
                  Jelaskan Kegiatan
                  <RequiredHint />
                </Label>
                <textarea
                  id="keperluan"
                  {...register("keperluan")}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Jelaskan kegiatan yang memerlukan peminjaman alat ini"
                />
                {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lokasiLainnya">
                  Lokasi
                  <RequiredHint />
                </Label>
                <Input id="lokasiLainnya" {...register("lokasi")} placeholder="Lokasi kegiatan" />
                {errors.lokasi && <p className="text-xs text-destructive">{errors.lokasi.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tanggalPinjam">Tanggal Pinjam</Label>
            <Input
              id="tanggalPinjam"
              type="date"
              {...tanggalPinjamField}
              onChange={(e) => {
                tanggalPinjamField.onChange(e);
                if (!kembaliTouched) setValue("tanggalKembali", e.target.value);
              }}
            />
            {errors.tanggalPinjam && <p className="text-xs text-destructive">{errors.tanggalPinjam.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jamPinjam">Jam Pinjam</Label>
            <div className="relative">
              <select
                id="jamPinjam"
                {...register("jamPinjam")}
                defaultValue=""
                className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Pilih jam
                </option>
                {JAM_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.jamPinjam && <p className="text-xs text-destructive">{errors.jamPinjam.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalKembali">Tanggal Kembali</Label>
            <Input
              id="tanggalKembali"
              type="date"
              {...tanggalKembaliField}
              onChange={(e) => {
                tanggalKembaliField.onChange(e);
                setKembaliTouched(true);
              }}
            />
            {errors.tanggalKembali && <p className="text-xs text-destructive">{errors.tanggalKembali.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jamKembali">Jam Kembali</Label>
            <div className="relative">
              <select
                id="jamKembali"
                {...register("jamKembali")}
                defaultValue=""
                className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Pilih jam
                </option>
                {JAM_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.jamKembali && <p className="text-xs text-destructive">{errors.jamKembali.message}</p>}
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
            <Label>Daftar Barang Dipilih ({cart.length} item)</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Barang
            </Button>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada barang dipilih.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((c) => (
                <li key={c.unitId ?? c.itemId} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <AlatThumbnail src={c.fotoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nama}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {c.kodeUnit && <span className="font-mono text-xs text-muted-foreground">{c.kodeUnit}</span>}
                      {c.categoryNama && (
                        <span className="inline-flex items-center rounded-full bg-upi-50 px-2 py-0.5 text-[10px] font-medium text-upi-700">
                          {c.categoryNama}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.unitId ? (
                    <span className="shrink-0 text-xs text-muted-foreground">1 unit</span>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => updateJumlah(c.itemId, c.jumlah - 1)}
                        disabled={c.jumlah <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{c.jumlah}</span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => updateJumlah(c.itemId, c.jumlah + 1)}
                        disabled={c.jumlah >= c.maksimal}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

      <PilihAlatSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        categories={categories}
        excludeUnitIds={excludeUnitIds}
        onPickItem={pickItem}
        onPickUnit={pickUnit}
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={submitting || !canSubmit}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Ajukan Peminjaman
        </Button>
      </div>
    </form>
  );
}
