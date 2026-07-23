import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoanForm } from "@/components/peminjaman/loan-form";

export default async function AjukanPeminjamanPage() {
  await requireRole("MAHASISWA");
  const courses = await prisma.course.findMany({ where: { menggunakanLab: true }, orderBy: { nama: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/peminjaman" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Peminjaman
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajukan Peminjaman</h1>
        <p className="text-sm text-muted-foreground">Isi formulir berikut untuk mengajukan peminjaman alat laboratorium.</p>
      </div>
      <LoanForm courses={courses} />
    </div>
  );
}
