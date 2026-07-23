"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createLoan } from "@/lib/actions/peminjaman";
import { loanFormFieldsSchema, type LoanFormFields } from "@/lib/validations/peminjaman";
import { createClient } from "@/lib/supabase/client";
import type { Course, InventoryItem } from "@prisma/client";

interface CartItem {
  itemId: string;
  nama: string;
  jumlah: number;
  maksimal: number;
}

export function LoanForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormFields>({
    resolver: zodResolver(loanFormFieldsSchema),
  });

  const { data: searchResults, isFetching } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ["inventaris-picker", query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, sort: "nama-asc", page: "1" });
      const res = await fetch(`/api/inventaris?${params.toString()}`);
      return res.json();
    },
    enabled: query.length > 0,
  });

  const availableResults = useMemo(
    () => (searchResults?.items ?? []).filter((i) => i.jumlahTersedia > 0 && !cart.some((c) => c.itemId === i.id)),
    [searchResults, cart],
  );

  function addToCart(item: InventoryItem) {
    setCart((prev) => [...prev, { itemId: item.id, nama: item.nama, jumlah: 1, maksimal: item.jumlahTersedia }]);
    setQuery("");
  }

  function updateJumlah(itemId: string, jumlah: number) {
    setCart((prev) => prev.map((c) => (c.itemId === itemId ? { ...c, jumlah: Math.max(1, Math.min(jumlah, c.maksimal)) } : c)));
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
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
            <Label htmlFor="dosenPengampu">Dosen Pengampu</Label>
            <Input id="dosenPengampu" {...register("dosenPengampu")} placeholder="Nama dosen" />
            {errors.dosenPengampu && <p className="text-xs text-destructive">{errors.dosenPengampu.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalPinjam">Tanggal Pinjam</Label>
            <Input id="tanggalPinjam" type="date" {...register("tanggalPinjam")} />
            {errors.tanggalPinjam && <p className="text-xs text-destructive">{errors.tanggalPinjam.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalKembali">Tanggal Kembali</Label>
            <Input id="tanggalKembali" type="date" {...register("tanggalKembali")} />
            {errors.tanggalKembali && <p className="text-xs text-destructive">{errors.tanggalKembali.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jam">Jam Penggunaan</Label>
            <Input id="jam" {...register("jam")} placeholder="cth. 08.00 - 10.00" />
            {errors.jam && <p className="text-xs text-destructive">{errors.jam.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="keperluan">Keperluan</Label>
            <textarea
              id="keperluan"
              {...register("keperluan")}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Jelaskan keperluan peminjaman"
            />
            {errors.keperluan && <p className="text-xs text-destructive">{errors.keperluan.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="surat">Upload Surat (opsional)</Label>
            <Input id="surat" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="space-y-4 pt-6">
          <Label>Daftar Barang</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama barang atau kode..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-card">
                {isFetching ? (
                  <p className="p-3 text-sm text-muted-foreground">Mencari...</p>
                ) : availableResults.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Tidak ada barang tersedia yang cocok.</p>
                ) : (
                  availableResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span>{item.nama}</span>
                      <span className="text-xs text-muted-foreground">{item.jumlahTersedia} tersedia</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada barang dipilih.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((c) => (
                <li key={c.itemId} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nama}</span>
                  <Input
                    type="number"
                    min={1}
                    max={c.maksimal}
                    value={c.jumlah}
                    onChange={(e) => updateJumlah(c.itemId, Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">/ {c.maksimal}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFromCart(c.itemId)}>
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
