"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Plus, ChevronDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createUser, updateUserRole } from "@/lib/actions/pengguna";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/pengguna";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Profile, Role } from "@prisma/client";

const ROLES: Role[] = ["KEPALA_LAB", "DOSEN", "LABORAN", "MAHASISWA"];

function RoleSelect({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(role: Role) {
    setPending(true);
    try {
      await updateUserRole(profile.id, role);
      toast.success(`Role ${profile.name} diperbarui menjadi ${ROLE_LABELS[role]}.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui role.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative w-full sm:w-52">
      <select
        value={profile.role}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as Role)}
        className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-7 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { role: "MAHASISWA" } });

  async function onSubmit(values: CreateUserInput) {
    setServerError(null);
    try {
      await createUser(values);
      toast.success("Pengguna berhasil dibuat.");
      router.refresh();
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal membuat pengguna.");
    }
  }

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <div className="relative">
              <select
                id="role"
                {...register("role")}
                className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password Awal</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nim">NIM (mahasiswa)</Label>
            <Input id="nim" {...register("nim")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nip">NIP (dosen/staf)</Label>
            <Input id="nip" {...register("nip")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prodi">Program Studi</Label>
            <Input id="prodi" {...register("prodi")} />
          </div>
          {serverError && <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onDone}>
              Batal
            </Button>
            <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat Pengguna
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PenggunaClient({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.nim?.toLowerCase().includes(q) ||
        p.nip?.toLowerCase().includes(q),
    );
  }, [profiles, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, NIM/NIP..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button className="bg-upi-700 hover:bg-upi-800" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Tutup Form" : "Tambah Pengguna"}
        </Button>
      </div>

      {showForm && <CreateUserForm onDone={() => setShowForm(false)} />}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {filtered.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.email}
                  {p.nim && ` · NIM ${p.nim}`}
                  {p.nip && ` · NIP ${p.nip}`}
                  {p.prodi && ` · ${p.prodi}`}
                </p>
              </div>
              <RoleSelect profile={p} />
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-10 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
