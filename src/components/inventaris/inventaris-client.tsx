"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { LayoutGrid, List, Search, Boxes, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KondisiBadge } from "@/components/inventaris/kondisi-badge";
import { cn } from "@/lib/utils";
import type { Category, InventoryItem, Kondisi, Location } from "@prisma/client";

type Item = InventoryItem & { category: Category; location: Location | null };
interface ApiResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_OPTIONS = [
  { value: "nama-asc", label: "Nama (A-Z)" },
  { value: "nama-desc", label: "Nama (Z-A)" },
  { value: "jumlah-desc", label: "Jumlah Terbanyak" },
  { value: "tahun-desc", label: "Terbaru Dibeli" },
];

export function InventarisClient({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("semua");
  const [kondisi, setKondisi] = useState("semua");
  const [lokasi, setLokasi] = useState("semua");
  const [sort, setSort] = useState("nama-asc");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "table">("table");

  const { data, isLoading, isFetching } = useQuery<ApiResponse>({
    queryKey: ["inventaris", { q, kategori, kondisi, lokasi, sort, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ q, kategori, kondisi, lokasi, sort, page: String(page) });
      const res = await fetch(`/api/inventaris?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat inventaris");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        header: "Nama Barang",
        accessorKey: "nama",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.nama}</p>
            <p className="text-xs text-muted-foreground">{row.original.kodeInventaris}</p>
          </div>
        ),
      },
      { header: "Kategori", cell: ({ row }) => row.original.category.nama },
      { header: "Merk", cell: ({ row }) => row.original.merk ?? "—" },
      {
        header: "Jumlah",
        cell: ({ row }) => (
          <span>
            {row.original.jumlahTersedia}/{row.original.jumlahTotal}
          </span>
        ),
      },
      { header: "Lokasi", cell: ({ row }) => row.original.location?.ruangan ?? "—" },
      {
        header: "Kondisi",
        cell: ({ row }) => <KondisiBadge kondisi={row.original.kondisi} />,
      },
    ],
    [],
  );

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventaris</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} barang` : "Memuat..."} di seluruh laboratorium
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama barang, kode, atau merk..."
            className="pl-9"
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:flex lg:shrink-0">
          <Select value={kategori} onValueChange={resetPage(setKategori)}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kondisi} onValueChange={resetPage(setKondisi)}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kondisi</SelectItem>
              {(["BERFUNGSI", "PERLU_VERIFIKASI", "MAINTENANCE", "RUSAK", "HILANG"] as Kondisi[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {k.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lokasi} onValueChange={resetPage(setLokasi)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Lokasi</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.ruangan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={cn("rounded-xl border border-border bg-card shadow-soft", isFetching && "opacity-60")}>
        {isLoading ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Memuat inventaris...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-14 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Tidak ada barang yang cocok dengan pencarian.</p>
          </div>
        ) : view === "table" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/inventaris/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/inventaris/${item.id}`}
                className="rounded-xl border border-border p-4 transition-shadow hover:shadow-card"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-muted">
                  <Boxes className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
                <p className="text-xs text-muted-foreground">{item.kodeInventaris}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.jumlahTersedia}/{item.jumlahTotal} unit
                  </span>
                  <KondisiBadge kondisi={item.kondisi} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
