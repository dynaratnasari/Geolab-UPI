"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailabilityBadge } from "./availability-badge";
import { UnitStatusBadge } from "@/components/inventaris/unit-status-badge";
import type { UnitStatus } from "@prisma/client";

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
    };

interface CategoryOption {
  id: string;
  nama: string;
}

export function DatabaseAlatClient({
  items,
  categories,
  initialCategory,
}: {
  items: AlatRow[];
  categories: CategoryOption[];
  initialCategory?: string;
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory ?? "ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === "ALL" || item.categoryId === activeCategory;
      const matchesQuery =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q) ||
        (item.merk?.toLowerCase().includes(q) ?? false);
      return matchesCategory && matchesQuery;
    });
  }, [items, activeCategory, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, kode, atau merk alat..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {items.length} alat
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryPill label="Semua" active={activeCategory === "ALL"} onClick={() => setActiveCategory("ALL")} />
        {categories.map((c) => (
          <CategoryPill key={c.id} label={c.nama} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} />
        ))}
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden overflow-hidden rounded-xl border border-border shadow-soft md:block">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-upi-900">
              <tr>
                <Th>Kode Identitas</Th>
                <Th>Kategori Klasifikasi</Th>
                <Th>Nomenklatur / Model Instrumen</Th>
                <Th align="center">Stok Master</Th>
                <Th align="center">Tersedia</Th>
                <Th>Status Operasional</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filtered.map((item) => {
                const stok = item.kind === "aggregate" ? item.jumlahTotal : 1;
                const tersedia = item.kind === "aggregate" ? item.jumlahTersedia : item.status === "TERSEDIA" ? 1 : 0;
                const detailId = item.kind === "aggregate" ? item.id : item.itemId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/database-alat/${detailId}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-upi-700">{item.kode}</td>
                    <td className="px-4 py-3">
                      <CategoryTag label={item.categoryNama} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{item.nama}</p>
                      {item.merk && <p className="text-xs text-muted-foreground">{item.merk}</p>}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-upi-700">{stok}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-center font-semibold",
                        tersedia > 0 ? "text-status-tersedia" : "text-status-rusak",
                      )}
                    >
                      {tersedia}
                    </td>
                    <td className="px-4 py-3">
                      {item.kind === "aggregate" ? (
                        <AvailabilityBadge available={item.jumlahTersedia > 0} />
                      ) : (
                        <UnitStatusBadge status={item.status} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada alat yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((item) => {
          const stok = item.kind === "aggregate" ? item.jumlahTotal : 1;
          const tersedia = item.kind === "aggregate" ? item.jumlahTersedia : item.status === "TERSEDIA" ? 1 : 0;
          const detailId = item.kind === "aggregate" ? item.id : item.itemId;
          return (
            <div
              key={item.id}
              onClick={() => router.push(`/database-alat/${detailId}`)}
              className="cursor-pointer rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-semibold text-upi-700">{item.kode}</p>
                  <p className="mt-1 font-semibold text-foreground">{item.nama}</p>
                  {item.merk && <p className="text-xs text-muted-foreground">{item.merk}</p>}
                </div>
                {item.kind === "aggregate" ? (
                  <AvailabilityBadge available={item.jumlahTersedia > 0} />
                ) : (
                  <UnitStatusBadge status={item.status} />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <CategoryTag label={item.categoryNama} />
                <span className="text-muted-foreground">
                  Tersedia <b className={tersedia > 0 ? "text-status-tersedia" : "text-status-rusak"}>{tersedia}</b> / {stok}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Tidak ada alat yang cocok dengan pencarian.
          </p>
        )}
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
      {label}
    </span>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-upi-700 text-white shadow-soft" : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
