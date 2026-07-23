"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  nim: z.string().min(5, "NIM tidak valid"),
  prodi: z.string().min(2, "Program studi wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterForm) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name, nim: values.nim, prodi: values.prodi } },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (success) {
    return (
      <Card className="border-border shadow-soft">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Pendaftaran berhasil. Mengalihkan ke halaman masuk...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" {...register("name")} autoFocus />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nim">NIM</Label>
            <Input id="nim" {...register("nim")} />
            {errors.nim && <p className="text-xs text-destructive">{errors.nim.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prodi">Program Studi</Label>
            <Input id="prodi" placeholder="cth. S1 Sains Informasi Geografi" {...register("prodi")} />
            {errors.prodi && <p className="text-xs text-destructive">{errors.prodi.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full bg-upi-700 hover:bg-upi-800" disabled={isSubmitting}>
            {isSubmitting ? "Mendaftar..." : "Daftar"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-upi-700 hover:underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
