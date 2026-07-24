"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateMyProfile } from "@/lib/actions/profil";
import { myProfileSchema, type MyProfileInput } from "@/lib/validations/pengguna";
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
  const isMahasiswa = profile.role === "MAHASISWA";
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<MyProfileInput>({
    resolver: zodResolver(myProfileSchema),
    defaultValues: {
      nim: profile.nim ?? "",
      nip: profile.nip ?? "",
      prodi: profile.prodi ?? "",
      angkatan: profile.angkatan ? String(profile.angkatan) : "",
      alamat: profile.alamat ?? "",
      asalInstansi: profile.asalInstansi ?? "",
    },
  });

  async function handlePhotoChange(file: File | null) {
    if (!file) return;
    setUploading(true);
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
      setUploading(false);
    }
  }

  async function onSubmit(values: MyProfileInput) {
    try {
      await updateMyProfile({ ...values, avatarUrl });
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
              disabled={uploading}
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
              className="h-9 max-w-xs text-xs"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nama</Label>
            <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
              {profile.name}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idField">{isMahasiswa ? "NIM" : "NIK"}</Label>
            <Input id="idField" {...register(isMahasiswa ? "nim" : "nip")} />
          </div>

          {isMahasiswa ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input id="prodi" {...register("prodi")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="angkatan">Angkatan</Label>
                <Input id="angkatan" type="number" {...register("angkatan")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dosen Wali</Label>
                <div className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
                  {dosenWaliName ?? "Belum ditentukan"}
                </div>
                <p className="text-xs text-muted-foreground">Dosen wali ditentukan oleh Kepala Lab, tidak bisa diubah di sini.</p>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="asalInstansi">Asal Instansi</Label>
              <Input id="asalInstansi" {...register("asalInstansi")} />
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input id="alamat" {...register("alamat")} />
          </div>

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" className="bg-upi-700 hover:bg-upi-800" disabled={isSubmitting || uploading}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
