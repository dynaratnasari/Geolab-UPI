"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, IdCard, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateMyProfile, getMyKtpPreviewUrl } from "@/lib/actions/profil";
import { myProfileSchema, KATEGORI_PENGGUNA_OPTIONS, type MyProfileInput } from "@/lib/validations/pengguna";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@prisma/client";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function ProfilForm({ profile, dosenWaliName }: { profile: Profile; dosenWaliName?: string }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [ktpPath, setKtpPath] = useState(profile.ktpUrl ?? "");
  const [ktpPreviewUrl, setKtpPreviewUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MyProfileInput>({
    resolver: zodResolver(myProfileSchema),
    defaultValues: {
      name: profile.name,
      kategoriPengguna: profile.kategoriPengguna ?? undefined,
      nim: profile.nim ?? "",
      nip: profile.nip ?? "",
      nidn: profile.nidn ?? "",
      prodi: profile.prodi ?? "",
      angkatan: profile.angkatan ? String(profile.angkatan) : "",
      alamat: profile.alamat ?? "",
      asalInstansi: profile.asalInstansi ?? "",
      alamatInstansi: profile.alamatInstansi ?? "",
      phone: profile.phone ?? "",
    },
  });

  const kategori = watch("kategoriPengguna");

  useEffect(() => {
    if (profile.ktpUrl) {
      getMyKtpPreviewUrl().then(setKtpPreviewUrl);
    }
  }, [profile.ktpUrl]);

  async function handlePhotoChange(file: File | null) {
    if (!file) return;
    setUploadingFoto(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      setAvatarUrl(url);
      toast.success("Foto berhasil diunggah. Jangan lupa klik Simpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleKtpChange(file: File | null) {
    if (!file) return;
    setUploadingKtp(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}/ktp-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      setKtpPath(path);
      const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 5);
      setKtpPreviewUrl(data?.signedUrl ?? null);
      toast.success("KTP berhasil diunggah. Jangan lupa klik Simpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah KTP.");
    } finally {
      setUploadingKtp(false);
    }
  }

  async function onSubmit(values: MyProfileInput) {
    try {
      await updateMyProfile({ ...values, avatarUrl, ktpUrl: ktpPath });
      toast.success("Profil berhasil disimpan.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    }
  }

  return (
    <Card className="shadow-soft">
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name} />}
            <AvatarFallback className="bg-upi-100 text-lg font-semibold text-upi-700">
              {initials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <Label htmlFor="foto" className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              Ganti Foto
            </Label>
            <Input
              id="foto"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingFoto}
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
              className="h-9 max-w-xs text-xs"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="kategoriPengguna">Jenis Pengguna</Label>
            <div className="relative">
              <select
                id="kategoriPengguna"
                {...register("kategoriPengguna")}
                defaultValue=""
                className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-8 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Pilih jenis pengguna
                </option>
                {KATEGORI_PENGGUNA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {kategori === "MAHASISWA" && (
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
                <Label>Dosen Wali</Label>
                <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
                  {dosenWaliName ?? "Belum ditentukan"}
                </div>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
                Dosen wali ditentukan oleh Kepala Lab, tidak bisa diubah di sini.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Nomor Telepon/HP</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamat">Alamat Rumah</Label>
                <Input id="alamat" {...register("alamat")} />
              </div>
            </>
          )}

          {kategori === "DOSEN" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nidn">NIDN</Label>
                <Input id="nidn" {...register("nidn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asalInstansi">Instansi</Label>
                <Input id="asalInstansi" {...register("asalInstansi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamatInstansi">Alamat Instansi</Label>
                <Input id="alamatInstansi" {...register("alamatInstansi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamat">Alamat Rumah</Label>
                <Input id="alamat" {...register("alamat")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone">Nomor Telepon/HP</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </>
          )}

          {kategori === "UMUM" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="asalInstansi">Asal Instansi</Label>
                <Input id="asalInstansi" {...register("asalInstansi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamatInstansi">Alamat Instansi</Label>
                <Input id="alamatInstansi" {...register("alamatInstansi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alamat">Alamat Rumah</Label>
                <Input id="alamat" {...register("alamat")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Nomor Telepon/HP</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ktp" className="flex items-center gap-1.5">
                  <IdCard className="h-3.5 w-3.5" />
                  Upload KTP
                </Label>
                <Input
                  id="ktp"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  disabled={uploadingKtp}
                  onChange={(e) => handleKtpChange(e.target.files?.[0] ?? null)}
                />
                {ktpPreviewUrl && (
                  <a
                    href={ktpPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-upi-700 hover:underline"
                  >
                    Lihat KTP yang sudah diunggah
                  </a>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting || uploadingFoto || uploadingKtp}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
