"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Boxes, Tag, MapPin, User, BookMarked } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { LoanStatus, Role } from "@prisma/client";

interface SearchResults {
  items: { id: string; nama: string; kodeInventaris: string }[];
  categories: { id: string; nama: string }[];
  locations: { id: string; ruangan: string; gedung: string }[];
  profiles: { id: string; name: string; role: Role; nim: string | null }[];
  loans: { id: string; nomorPeminjaman: string; status: LoanStatus; mahasiswa: { name: string } }[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const { data, isFetching } = useQuery<SearchResults>({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.trim().length >= 2,
  });

  const showDropdown = focused && query.trim().length >= 2;
  const hasResults =
    data && (data.items.length || data.categories.length || data.locations.length || data.profiles.length || data.loans.length);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Cari alat, kode, ruangan..."
        className="pl-9"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {showDropdown && (
        <div className="absolute z-30 mt-1 max-h-96 w-full min-w-[320px] overflow-y-auto rounded-lg border border-border bg-popover shadow-card">
          {isFetching ? (
            <p className="p-4 text-sm text-muted-foreground">Mencari...</p>
          ) : !hasResults ? (
            <p className="p-4 text-sm text-muted-foreground">Tidak ada hasil untuk &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="py-1">
              {data!.items.length > 0 && (
                <SearchGroup label="Barang" icon={Boxes}>
                  {data!.items.map((item) => (
                    <SearchRow key={item.id} href={`/inventaris/${item.id}`} title={item.nama} subtitle={item.kodeInventaris} />
                  ))}
                </SearchGroup>
              )}
              {data!.categories.length > 0 && (
                <SearchGroup label="Kategori" icon={Tag}>
                  {data!.categories.map((c) => (
                    <SearchRow key={c.id} title={c.nama} />
                  ))}
                </SearchGroup>
              )}
              {data!.locations.length > 0 && (
                <SearchGroup label="Lokasi" icon={MapPin}>
                  {data!.locations.map((l) => (
                    <SearchRow key={l.id} href={`/lokasi/${l.id}`} title={l.ruangan} subtitle={l.gedung} />
                  ))}
                </SearchGroup>
              )}
              {data!.profiles.length > 0 && (
                <SearchGroup label="Pengguna" icon={User}>
                  {data!.profiles.map((p) => (
                    <SearchRow key={p.id} title={p.name} subtitle={p.nim ?? ROLE_LABELS[p.role]} />
                  ))}
                </SearchGroup>
              )}
              {data!.loans.length > 0 && (
                <SearchGroup label="Peminjaman" icon={BookMarked}>
                  {data!.loans.map((l) => (
                    <SearchRow
                      key={l.id}
                      href={`/peminjaman/${l.id}`}
                      title={l.nomorPeminjaman}
                      subtitle={l.mahasiswa.name}
                    />
                  ))}
                </SearchGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Boxes;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      {children}
    </div>
  );
}

function SearchRow({ href, title, subtitle }: { href?: string; title: string; subtitle?: string }) {
  const content = (
    <div className="flex items-center justify-between px-3 py-2 text-sm hover:bg-accent">
      <span className="truncate font-medium text-foreground">{title}</span>
      {subtitle && <span className="ml-2 shrink-0 text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
