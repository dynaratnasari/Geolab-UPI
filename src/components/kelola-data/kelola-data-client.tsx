"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Plus, X, Pencil, Trash2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TIPE_ALAT_LABEL, TIPE_ALAT_OPTIONS } from "@/lib/constants/inventaris";
import {
  createAlat,
  updateAlat,
  deleteAlat,
  createMatkul,
  updateMatkul,
  deleteMatkul,
  createDosen,
  updateDosen,
  deleteDosen,
} from "@/lib/actions/kelola-data";
import { alatSchema, matkulSchema, dosenSchema, type AlatInput, type MatkulInput, type DosenInput } from "@/lib/validations/kelola-data";
import type { Course } from "@prisma/client";

// ---------- shared bits ----------

interface AlatRow {
  id: string;
  nama: string;
  kodeInventaris: string;
  merk: string | null;
  spesifikasi: string | null;
  jumlahTotal: number;
  jumlahTersedia: number;
  tipeAlat: "TIPE_1" | "TIPE_2" | "TIPE_3";
  deskripsi: string | null;
  categoryId: string;
  locationId: string | null;
  category: { nama: string };
  location: { ruangan: string } | null;
}

interface DosenRow {
  id: string;
  name: string;
  nip: string | null;
  nidn: string | null;
  prodi: string | null;
}

type Option = { id: string; nama?: string; ruangan?: string; gedung?: string };

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SelectField({
  id,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select id={id} className={selectClass} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function DeleteButton({ onDelete, label }: { onDelete: () => Promise<void>; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setPending(true);
    try {
      await onDelete();
      toast.success(`${label} dihapus.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={confirming ? "destructive" : "outline"}
      className={cn(!confirming && "text-destructive")}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {confirming ? "Yakin hapus?" : "Hapus"}
    </Button>
  );
}

// ---------- Alat ----------

function AlatForm({
  initial,
  categories,
  locations,
  onSubmit,
  onDone,
  submitLabel,
}: {
  initial?: AlatRow;
  categories: Option[];
  locations: Option[];
  onSubmit: (values: AlatInput) => Promise<unknown>;
  onDone: () => void;
  submitLabel: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlatInput>({
    resolver: zodResolver(alatSchema),
    defaultValues: initial
      ? {
          nama: initial.nama,
          categoryId: initial.categoryId,
          merk: initial.merk ?? "",
          spesifikasi: initial.spesifikasi ?? "",
          jumlahTotal: initial.jumlahTotal,
          locationId: initial.locationId ?? "",
          tipeAlat: initial.tipeAlat,
          deskripsi: initial.deskripsi ?? "",
        }
      : { tipeAlat: "TIPE_1", jumlahTotal: 1, categoryId: "", locationId: "" },
  });

  async function submit(values: AlatInput) {
    setServerError(null);
    try {
      await onSubmit(values);
      toast.success(initial ? "Alat diperbarui." : "Alat ditambahkan.");
      router.refresh();
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal menyimpan alat.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Nama Alat</Label>
        <Input {...register("nama")} />
        {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Kategori</Label>
        <SelectField {...register("categoryId")}>
          <option value="" disabled>
            Pilih kategori
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </SelectField>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Merk</Label>
        <Input {...register("merk")} />
      </div>
      <div className="space-y-1.5">
        <Label>Jumlah Total</Label>
        <Input type="number" min={1} {...register("jumlahTotal", { valueAsNumber: true })} />
        {errors.jumlahTotal && <p className="text-xs text-destructive">{errors.jumlahTotal.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Lokasi Penyimpanan</Label>
        <SelectField {...register("locationId")}>
          <option value="">Belum ditentukan</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.ruangan} — {l.gedung}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="space-y-1.5">
        <Label>Tipe Alat (risiko)</Label>
        <SelectField {...register("tipeAlat")}>
          {TIPE_ALAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="space-y-1.5">
        <Label>Spesifikasi</Label>
        <Input {...register("spesifikasi")} />
      </div>
      <div className="space-y-1.5">
        <Label>Deskripsi</Label>
        <Input {...register("deskripsi")} />
      </div>
      {serverError && <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function AlatTab({ items, categories, locations }: { items: AlatRow[]; categories: Option[]; locations: Option[] }) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.nama.toLowerCase().includes(q) || i.kodeInventaris.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama atau kode alat..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button className="bg-upi-700 hover:bg-upi-800" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Tutup Form" : "Tambah Alat"}
        </Button>
      </div>

      {showCreate && (
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <AlatForm
              categories={categories}
              locations={locations}
              onSubmit={(v) => createAlat(v)}
              onDone={() => setShowCreate(false)}
              submitLabel="Tambah Alat"
            />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {filtered.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{item.kodeInventaris}</span> · {item.category.nama} ·{" "}
                    {item.jumlahTersedia}/{item.jumlahTotal} tersedia · {TIPE_ALAT_LABEL[item.tipeAlat]}
                    {item.location && ` · ${item.location.ruangan}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {editingId === item.id ? "Tutup" : "Edit"}
                  </Button>
                  <DeleteButton onDelete={() => deleteAlat(item.id)} label={`Alat "${item.nama}"`} />
                </div>
              </div>
              {editingId === item.id && (
                <div className="mt-3 rounded-lg border border-border p-4">
                  <AlatForm
                    initial={item}
                    categories={categories}
                    locations={locations}
                    onSubmit={(v) => updateAlat(item.id, v)}
                    onDone={() => setEditingId(null)}
                    submitLabel="Simpan"
                  />
                </div>
              )}
            </li>
          ))}
          {filtered.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">Tidak ada alat yang cocok.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------- Mata Kuliah ----------

function MatkulForm({
  initial,
  onSubmit,
  onDone,
  submitLabel,
}: {
  initial?: Course;
  onSubmit: (values: MatkulInput) => Promise<unknown>;
  onDone: () => void;
  submitLabel: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MatkulInput>({
    resolver: zodResolver(matkulSchema),
    defaultValues: initial
      ? { kode: initial.kode, nama: initial.nama, sks: initial.sks, prodi: initial.prodi, menggunakanLab: initial.menggunakanLab }
      : { sks: 2, menggunakanLab: true, prodi: "S1 Pendidikan Geografi" },
  });

  async function submit(values: MatkulInput) {
    setServerError(null);
    try {
      await onSubmit(values);
      toast.success(initial ? "Mata kuliah diperbarui." : "Mata kuliah ditambahkan.");
      router.refresh();
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal menyimpan mata kuliah.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Kode</Label>
        <Input {...register("kode")} />
        {errors.kode && <p className="text-xs text-destructive">{errors.kode.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Nama Mata Kuliah</Label>
        <Input {...register("nama")} />
        {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>SKS</Label>
        <Input type="number" min={1} max={6} {...register("sks", { valueAsNumber: true })} />
        {errors.sks && <p className="text-xs text-destructive">{errors.sks.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Prodi</Label>
        <Input {...register("prodi")} />
        {errors.prodi && <p className="text-xs text-destructive">{errors.prodi.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" {...register("menggunakanLab")} className="h-4 w-4 rounded border-input" />
        Menggunakan alat lab (tampil di form pengajuan peminjaman)
      </label>
      {serverError && <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function MatkulTab({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.nama.toLowerCase().includes(q) || c.kode.toLowerCase().includes(q));
  }, [courses, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama atau kode matkul..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button className="bg-upi-700 hover:bg-upi-800" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Tutup Form" : "Tambah Mata Kuliah"}
        </Button>
      </div>

      {showCreate && (
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <MatkulForm onSubmit={(v) => createMatkul(v)} onDone={() => setShowCreate(false)} submitLabel="Tambah Mata Kuliah" />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {filtered.map((course) => (
            <li key={course.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{course.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{course.kode}</span> · {course.sks} SKS · {course.prodi}
                    {!course.menggunakanLab && " · tidak pakai lab"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === course.id ? null : course.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {editingId === course.id ? "Tutup" : "Edit"}
                  </Button>
                  <DeleteButton onDelete={() => deleteMatkul(course.id)} label={`Mata kuliah "${course.nama}"`} />
                </div>
              </div>
              {editingId === course.id && (
                <div className="mt-3 rounded-lg border border-border p-4">
                  <MatkulForm
                    initial={course}
                    onSubmit={(v) => updateMatkul(course.id, v)}
                    onDone={() => setEditingId(null)}
                    submitLabel="Simpan"
                  />
                </div>
              )}
            </li>
          ))}
          {filtered.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">Tidak ada mata kuliah yang cocok.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------- Dosen ----------

function DosenForm({
  initial,
  onSubmit,
  onDone,
  submitLabel,
}: {
  initial?: DosenRow;
  onSubmit: (values: DosenInput) => Promise<unknown>;
  onDone: () => void;
  submitLabel: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DosenInput>({
    resolver: zodResolver(dosenSchema),
    defaultValues: initial
      ? { name: initial.name, nip: initial.nip ?? "", nidn: initial.nidn ?? "", prodi: initial.prodi ?? "" }
      : { prodi: "S1 Pendidikan Geografi" },
  });

  async function submit(values: DosenInput) {
    setServerError(null);
    try {
      await onSubmit(values);
      toast.success(initial ? "Data dosen diperbarui." : "Dosen ditambahkan.");
      router.refresh();
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal menyimpan data dosen.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Nama Lengkap (dengan gelar)</Label>
        <Input {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>NIP</Label>
        <Input {...register("nip")} />
      </div>
      <div className="space-y-1.5">
        <Label>NIDN</Label>
        <Input {...register("nidn")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Prodi</Label>
        <Input {...register("prodi")} />
      </div>
      {serverError && <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function DosenTab({ dosen }: { dosen: DosenRow[] }) {
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dosen;
    return dosen.filter((d) => d.name.toLowerCase().includes(q));
  }, [dosen, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari nama dosen..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button className="bg-upi-700 hover:bg-upi-800" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Tutup Form" : "Tambah Dosen"}
        </Button>
      </div>

      {showCreate && (
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <DosenForm onSubmit={(v) => createDosen(v)} onDone={() => setShowCreate(false)} submitLabel="Tambah Dosen" />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {filtered.map((d) => (
            <li key={d.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.nidn && `NIDN ${d.nidn} · `}
                    {d.nip && `NIP ${d.nip} · `}
                    {d.prodi ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === d.id ? null : d.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {editingId === d.id ? "Tutup" : "Edit"}
                  </Button>
                  <DeleteButton onDelete={() => deleteDosen(d.id)} label={`Dosen "${d.name}"`} />
                </div>
              </div>
              {editingId === d.id && (
                <div className="mt-3 rounded-lg border border-border p-4">
                  <DosenForm initial={d} onSubmit={(v) => updateDosen(d.id, v)} onDone={() => setEditingId(null)} submitLabel="Simpan" />
                </div>
              )}
            </li>
          ))}
          {filtered.length === 0 && <li className="p-10 text-center text-sm text-muted-foreground">Tidak ada dosen yang cocok.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------- Tabs shell ----------

const TABS = [
  { key: "alat", label: "Alat" },
  { key: "matkul", label: "Mata Kuliah" },
  { key: "dosen", label: "Dosen" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function KelolaDataClient({
  items,
  courses,
  dosen,
  categories,
  locations,
}: {
  items: AlatRow[];
  courses: Course[];
  dosen: DosenRow[];
  categories: Option[];
  locations: Option[];
}) {
  const [tab, setTab] = useState<TabKey>("alat");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "alat" && <AlatTab items={items} categories={categories} locations={locations} />}
      {tab === "matkul" && <MatkulTab courses={courses} />}
      {tab === "dosen" && <DosenTab dosen={dosen} />}
    </div>
  );
}
