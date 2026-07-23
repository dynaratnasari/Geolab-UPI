import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getLocationDetail } from "@/lib/queries/lokasi";
import { KondisiBadge } from "@/components/inventaris/kondisi-badge";

export default async function LokasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;
  const location = await getLocationDetail(id);
  if (!location) notFound();

  return (
    <div className="space-y-6">
      <Link href="/lokasi" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Lokasi Penyimpanan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{location.ruangan}</h1>
        <p className="text-sm text-muted-foreground">
          {location.gedung}
          {(location.lemari || location.rak) && ` · ${[location.lemari, location.rak].filter(Boolean).join(" · ")}`}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft">
        {location.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-14 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Belum ada barang di lokasi ini.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {location.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/inventaris/${item.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.kodeInventaris} · {item.category.nama}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {item.jumlahTersedia}/{item.jumlahTotal} unit
                    </span>
                    <KondisiBadge kondisi={item.kondisi} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
