import Link from "next/link";
import { Building2, Boxes, AlertTriangle, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getLocationsWithStats } from "@/lib/queries/lokasi";

export default async function LokasiPage() {
  await requireRole();
  const gedungGroups = await getLocationsWithStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lokasi Penyimpanan</h1>
        <p className="text-sm text-muted-foreground">
          Struktur penyimpanan: Gedung → Ruangan → Lemari → Rak → Posisi Barang
        </p>
      </div>

      {gedungGroups.map(({ gedung, ruangan }) => (
        <section key={gedung} className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-upi-700" />
            <h2 className="text-sm font-semibold text-foreground">{gedung}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ruangan.map((r) => (
              <Link
                key={r.id}
                href={`/lokasi/${r.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{r.ruangan}</p>
                    {(r.lemari || r.rak) && (
                      <p className="text-xs text-muted-foreground">
                        {[r.lemari, r.rak].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Boxes className="h-3.5 w-3.5" />
                    <span>{r.jenisBarang} jenis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-medium text-foreground">{r.tersediaUnit}</span>/{r.totalUnit} unit
                  </div>
                </div>

                {r.bermasalah > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {r.bermasalah} barang perlu perhatian
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
