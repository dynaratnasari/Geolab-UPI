import Link from "next/link";

export function KategoriChart({ data }: { data: { id: string; nama: string; jumlah: number }[] }) {
  const max = Math.max(...data.map((d) => d.jumlah), 1);

  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.id}>
          <Link
            href={`/inventaris?kategori=${d.id}`}
            className="group flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/60"
          >
            <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground sm:w-36">{d.nama}</span>
            <span className="relative h-4 flex-1 overflow-hidden rounded bg-muted">
              <span
                className="absolute inset-y-0 left-0 rounded bg-upi-700 transition-colors group-hover:bg-upi-800"
                style={{ width: `${(d.jumlah / max) * 100}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-xs font-semibold text-foreground">{d.jumlah}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
