"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Plus, ChevronDown, Loader2, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createUser, updateUserRole, updateUserProfile } from "@/lib/actions/pengguna";
import {
  createUserSchema,
  updateProfileSchema,
  type CreateUserInput,
  type UpdateProfileInput,
} from "@/lib/validations/pengguna";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Profile, Role } from "@prisma/client";

const ROLES: Role[] = ["KEPALA_LAB", "DOSEN", "LABORAN", "MAHASISWA"];

type DosenOption = { id: string; name: string };

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

function CreateUserForm({ dosenList, onDone }: { dosenList: DosenOption[]; onDone: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { role: "MAHASISWA" } });

  const role = watch("role");

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

          {role === "MAHASISWA" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nim">NIM</Label>
                <Input id="nim" {...register("nim")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input id="prodi" {...register("prodi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="angkatan">Angkatan</Label>
                <Input id="angkatan" type="number" {...register("angkatan")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dosenWaliId">Dosen Wali</Label>
                <div className="relative">
                  <select
                    id="dosenWaliId"
                    {...register("dosenWaliId")}
                    defaultValue=""
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Belum ditentukan</option>
                    {dosenList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="nip">NIK</Label>
              <Input id="nip" {...register("nip")} />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input id="alamat" {...register("alamat")} />
          </div>
          {role !== "MAHASISWA" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="asalInstansi">Asal Instansi</Label>
              <Input id="asalInstansi" {...register("asalInstansi")} />
            </div>
          )}
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

function EditProfileForm({ profile, dosenList, onDone }: { profile: Profile; dosenList: DosenOption[]; onDone: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nim: profile.nim ?? "",
      nip: profile.nip ?? "",
      prodi: profile.prodi ?? "",
      angkatan: profile.angkatan ? String(profile.angkatan) : "",
      alamat: profile.alamat ?? "",
      asalInstansi: profile.asalInstansi ?? "",
      dosenWaliId: profile.dosenWaliId ?? "",
    },
  });

  async function onSubmit(values: UpdateProfileInput) {
    setServerError(null);
    try {
      await updateUserProfile(profile.id, values);
      toast.success("Profil diperbarui.");
      router.refresh();
      onDone();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    }
  }

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile.role === "MAHASISWA" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor={`nim-${profile.id}`}>NIM</Label>
                <Input id={`nim-${profile.id}`} {...register("nim")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`prodi-${profile.id}`}>Program Studi</Label>
                <Input id={`prodi-${profile.id}`} {...register("prodi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`angkatan-${profile.id}`}>Angkatan</Label>
                <Input id={`angkatan-${profile.id}`} type="number" {...register("angkatan")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`dosenWaliId-${profile.id}`}>Dosen Wali</Label>
                <div className="relative">
                  <select
                    id={`dosenWaliId-${profile.id}`}
                    {...register("dosenWaliId")}
                    defaultValue={profile.dosenWaliId ?? ""}
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Belum ditentukan</option>
                    {dosenList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor={`nip-${profile.id}`}>NIK</Label>
              <Input id={`nip-${profile.id}`} {...register("nip")} />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`alamat-${profile.id}`}>Alamat</Label>
            <Input id={`alamat-${profile.id}`} {...register("alamat")} />
          </div>
          {profile.role !== "MAHASISWA" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`asalInstansi-${profile.id}`}>Asal Instansi</Label>
              <Input id={`asalInstansi-${profile.id}`} {...register("asalInstansi")} />
            </div>
          )}
          {errors.angkatan && <p className="text-xs text-destructive sm:col-span-2">{errors.angkatan.message}</p>}
          {serverError && <p className="text-sm text-destructive sm:col-span-2">{serverError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onDone}>
              Batal
            </Button>
            <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UserRow({ profile, dosenList }: { profile: Profile; dosenList: DosenOption[] }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.email}
            {profile.nim && ` · NIM ${profile.nim}`}
            {profile.nip && ` · NIK ${profile.nip}`}
            {profile.prodi && ` · ${profile.prodi}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RoleSelect profile={profile} />
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Tutup" : "Edit"}
          </Button>
        </div>
      </div>
      {editing && (
        <div className="mt-3">
          <EditProfileForm profile={profile} dosenList={dosenList} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}

export function PenggunaClient({ profiles, dosenList }: { profiles: Profile[]; dosenList: DosenOption[] }) {
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
            placeholder="Cari nama, email, NIM/NIK..."
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

      {showForm && <CreateUserForm dosenList={dosenList} onDone={() => setShowForm(false)} />}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {filtered.map((p) => (
            <UserRow key={p.id} profile={p} dosenList={dosenList} />
          ))}
          {filtered.length === 0 && (
            <li className="p-10 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
