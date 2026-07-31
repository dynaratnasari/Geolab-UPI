"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ImageOff, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "./availability-badge";
import { UnitStatusBadge } from "@/components/inventaris/unit-status-badge";
import type { UnitStatus } from "@prisma/client";

const PAGE_SIZE = 12;

// Tipe 1 (risiko rendah, jumlah banyak) tetap ditampilkan satu baris gabungan dengan
// hitungan stok. Tipe 2/3 (risiko sedang/tinggi) sudah dilacak per unit fisik di halaman
// Inventaris, jadi tiap unit tampil sebagai baris sendiri dengan kodeUnit-nya sendiri —
// bukan digabung jadi satu baris stok.
export type AlatRow =
  | {
      kind: "aggregate";
      id: string;
      kode: string;
      nama: string;
      merk: string | null;
      categoryId: string;
      categoryNama: string;
      jumlahTotal: number;
      jumlahTersedia: number;
      fotoUrl: string | null;
    }
  | {
      kind: "unit";
      id: string;
      itemId: string;
      kode: string;
      nama: string;
      merk: string | null;
      categoryId: string;
      categoryNama: string;
      status: UnitStatus;
      fotoUrl: string | null;
    };

function AlatThumbnail({ src, nama }: { src: string | null; nama: string }) {
  if (!src) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg border border-border bg-upi-50">
        <ImageOff className="h-7 w-7 text-upi-300" />
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
      className="h-28 w-full rounded-lg border border-border bg-white object-contain p-2"
    />
  );
}

interface CategoryOption {
  id: string;
  nama: string;
}

const SORT_OPTIONS = [
  { value: "nama-asc", label: "Nama (A-Z)" },
  { value: "nama-desc", label: "Nama (Z-A)" },
];

export function DatabaseAlatClient({
  items,
  categories,
  initialCategory,
  showPinjam = false,
}: {
  items: AlatRow[];
  categories: CategoryOption[];
  initialCategory?: string;
  showPinjam?: boolean;
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory ?? "ALL");
  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState("nama-asc");
  const [page, setPage] = useState(1);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = items.filter((item) => {
      const matchesCategory = activeCategory === "ALL" || item.categoryId === activeCategory;
      const matchesQuery =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q) ||
        (item.merk?.toLowerCase().includes(q) ?? false);
      const tersedia = item.kind === "aggregate" ? item.jumlahTersedia > 0 : item.status === "TERSEDIA";
      const matchesAvailability = !onlyAvailable || tersedia;
      return matchesCategory && matchesQuery && matchesAvailability;
    });
    result.sort((a, b) => (sort === "nama-desc" ? b.nama.localeCompare(a.nama) : a.nama.localeCompare(b.nama)));
    return result;
  }, [items, activeCategory, query, onlyAvailable, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPage();
          }}
          placeholder="Cari nama, kode, atau merk alat..."
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <CategoryPill
            label="Semua"
            count={items.length}
            active={activeCategory === "ALL"}
            onClick={() => {
              setActiveCategory("ALL");
              resetPage();
            }}
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.nama}
              count={categoryCounts.get(c.id) ?? 0}
              active={activeCategory === c.id}
              onClick={() => {
                setActiveCategory(c.id);
                resetPage();
              }}
            />
          ))}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={onlyAvailable}
          onClick={() => {
            setOnlyAvailable((v) => !v);
            resetPage();
          }}
          className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-foreground"
        >
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              onlyAvailable ? "bg-status-tersedia" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-transform",
                onlyAvailable ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </span>
          Hanya yang tersedia
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Semua Alat</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Urutkan:</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-input bg-transparent pl-3 pr-7 text-xs outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {paged.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Tidak ada alat yang cocok dengan pencarian.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {paged.map((item) => {
            const stok = item.kind === "aggregate" ? item.jumlahTotal : 1;
            const tersedia = item.kind === "aggregate" ? item.jumlahTersedia : item.status === "TERSEDIA" ? 1 : 0;
            const detailId = item.kind === "aggregate" ? item.id : item.itemId;
            return (
              <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-soft">
                <AlatThumbnail src={item.fotoUrl} nama={item.nama} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{item.nama}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {item.kode}
                    {item.merk ? ` · ${item.merk}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <CategoryTag label={item.categoryNama} />
                  {item.kind === "aggregate" ? (
                    <AvailabilityBadge available={item.jumlahTersedia > 0} />
                  ) : (
                    <UnitStatusBadge status={item.status} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", tersedia > 0 ? "bg-status-tersedia" : "bg-status-rusak")} />
                  {tersedia}/{stok} tersedia
                </p>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/database-alat/${detailId}`)}
                  >
                    Detail
                  </Button>
                  {showPinjam && (
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-upi-700 hover:bg-upi-800"
                      disabled={tersedia <= 0}
                      onClick={() => router.push("/peminjaman/ajukan")}
                    >
                      Pinjam
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button type="button" size="icon-sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground">
              Halaman {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Menampilkan {paged.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{(currentPage - 1) * PAGE_SIZE + paged.length} dari{" "}
          {filtered.length} alat
        </p>
      </div>
    </div>
  );
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center truncate rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
      {label}
    </span>
  );
}

function CategoryPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors",
        active ? "bg-upi-700 text-white shadow-soft" : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {label}
      <span className={cn("ml-1.5 text-xs", active ? "text-white/70" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}
