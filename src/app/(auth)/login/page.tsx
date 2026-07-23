"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <Card className="border-border shadow-soft">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="nama@geolab.upi.edu" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full bg-upi-700 hover:bg-upi-800" disabled={pending}>
            {pending ? "Masuk..." : "Masuk"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Mahasiswa belum punya akun?{" "}
          <Link href="/register" className="font-medium text-upi-700 hover:underline">
            Daftar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
