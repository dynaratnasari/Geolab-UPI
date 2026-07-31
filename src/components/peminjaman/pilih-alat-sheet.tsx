"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Kondisi } from "@prisma/client";

const PAGE_SIZE = 12; // must match src/app/api/inventaris/route.ts

export interface PickerItem {
  id: string;
  nama: string;
  kodeInventaris: string;
  merk: string | null;
  fotoUrl: string | null;
  tipeAlat: "TIPE_1" | "TIPE_2" | "TIPE_3";
  jumlahTotal: number;
  jumlahTersedia: number;
  categoryId: string;
  category: { nama: string };
}

export interface UnitOption {
  id: string;
  kodeUnit: string;
  kondisi: Kondisi;
}

interface CategoryOption {
  id: string;
  nama: string;
}

const SORT_OPTIONS = [
  { value: "nama-asc", label: "Nama A-Z" },
  { value: "nama-desc", label: "Nama Z-A" },
  { value: "jumlah-desc", label: "Stok Terbanyak" },
  { value: "jumlah-asc", label: "Stok Tersedikit" },
];

function ItemThumb({ src, nama }: { src: string | null; nama: string }) {
  if (!src) {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-lg border border-border bg-upi-50">
        <ImageOff className="h-6 w-6 text-upi-300" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nama}
      loading="lazy"
      decoding="async"
      className="h-24 w-full rounded-lg border border-border bg-white object-contain p-2"
    />
  );
}

export function PilihAlatSheet({
  open,
  onOpenChange,
  categories,
  excludeUnitIds,
  onPickItem,
  onPickUnit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  excludeUnitIds: string[];
  onPickItem: (item: PickerItem) => void;
  onPickUnit: (item: PickerItem, unit: UnitOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [sort, setSort] = useState("nama-asc");
  const [page, setPage] = useState(1);
  const [unitPickerItem, setUnitPickerItem] = useState<PickerItem | null>(null);

  const { data, isFetching } = useQuery<{ items: PickerItem[]; total: number }>({
    queryKey: ["pilih-alat", query, activeCategory, onlyAvailable, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort,
        page: String(page),
        ...(query && { q: query }),
        ...(activeCategory !== "ALL" && { kategori: activeCategory }),
        ...(onlyAvailable && { ketersediaan: "tersedia" }),
      });
      const res = await fetch(`/api/inventaris?${params.toString()}`);
      return res.json();
    },
    enabled: open && !unitPickerItem,
  });

  const { data: unitData, isFetching: isFetchingUnits } = useQuery<{ units: UnitOption[] }>({
    queryKey: ["pilih-alat-units", unitPickerItem?.id],
    queryFn: async () => {
      const res = await fetch(`/api/inventaris/${unitPickerItem!.id}/units`);
      return res.json();
    },
    enabled: !!unitPickerItem,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const availableUnits = (unitData?.units ?? []).filter((u) => !excludeUnitIds.includes(u.id));

  function handlePick(item: PickerItem) {
    if (item.tipeAlat === "TIPE_1") {
      onPickItem(item);
    } else {
      setUnitPickerItem(item);
    }
  }

  function close() {
    onOpenChange(false);
    setUnitPickerItem(null);
    setQuery("");
    setPage(1);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="shrink-0 border-b border-border p-4">
          <SheetTitle>Pilih Alat</SheetTitle>
        </SheetHeader>

        {unitPickerItem ? (
          <div className="flex-1 overflow-y-auto p-4">
            <button
              type="button"
              onClick={() => setUnitPickerItem(null)}
              className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke daftar alat
            </button>
            <p className="mb-3 text-sm font-medium text-foreground">Pilih unit — {unitPickerItem.nama}</p>
            <div className="space-y-2">
              {isFetchingUnits ? (
                <p className="text-sm text-muted-foreground">Memuat unit...</p>
              ) : availableUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada unit tersedia untuk alat ini.</p>
              ) : (
                availableUnits.map((unit) => (
                  <button
                    type="button"
                    key={unit.id}
                    onClick={() => onPickUnit(unitPickerItem, unit)}
                    className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-mono">{unit.kodeUnit}</span>
                    <span className="text-xs text-muted-foreground">{unit.kondisi.replaceAll("_", " ")}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama alat, kode, atau kategori..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="hidden w-44 shrink-0 space-y-1 overflow-y-auto border-r border-border p-3 sm:block">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kategori</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("ALL");
                    setPage(1);
                  }}
                  className={cn(
                    "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
                    activeCategory === "ALL" ? "bg-upi-100 font-medium text-upi-700" : "text-foreground hover:bg-accent",
                  )}
                >
                  Semua
                </button>
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setActiveCategory(c.id);
                      setPage(1);
                    }}
                    className={cn(
                      "block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm",
                      activeCategory === c.id ? "bg-upi-100 font-medium text-upi-700" : "text-foreground hover:bg-accent",
                    )}
                  >
                    {c.nama}
                  </button>
                ))}
              </div>

              <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyAvailable(true);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        onlyAvailable ? "bg-white shadow-soft" : "text-muted-foreground",
                      )}
                    >
                      Tersedia Saja
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyAvailable(false);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        !onlyAvailable ? "bg-white shadow-soft" : "text-muted-foreground",
                      )}
                    >
                      Semua Status
                    </button>
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                    className="h-7 appearance-none rounded-lg border border-input bg-transparent px-2 text-xs outline-none"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        Urutkan: {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mb-3 text-xs text-muted-foreground">
                  {isFetching ? "Memuat..." : `Menampilkan ${items.length} dari ${total} alat`}
                </p>

                {items.length === 0 && !isFetching ? (
                  <p className="flex-1 py-10 text-center text-sm text-muted-foreground">Tidak ada alat yang cocok.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border p-2.5 shadow-soft">
                        <ItemThumb src={item.fotoUrl} nama={item.nama} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.kodeInventaris}</p>
                        </div>
                        <span className="inline-flex w-fit items-center rounded-full bg-upi-50 px-2 py-0.5 text-[10px] font-medium text-upi-700">
                          {item.category.nama}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn("h-1.5 w-1.5 rounded-full", item.jumlahTersedia > 0 ? "bg-emerald-500" : "bg-red-500")} />
                          {item.jumlahTersedia} tersedia
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-1 w-full"
                          disabled={item.jumlahTersedia <= 0}
                          onClick={() => handlePick(item)}
                        >
                          + Tambah
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    <Button type="button" size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-xs text-muted-foreground">
                      Halaman {page} / {totalPages}
                    </span>
                    <Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
