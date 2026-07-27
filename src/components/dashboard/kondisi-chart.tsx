"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const KONDISI_LABEL: Record<string, string> = {
  BERFUNGSI: "Berfungsi",
  PERLU_VERIFIKASI: "Perlu Verifikasi",
  MAINTENANCE: "Maintenance",
  RUSAK: "Rusak",
  HILANG: "Hilang",
};

const KONDISI_COLOR: Record<string, string> = {
  BERFUNGSI: "#10b981",
  PERLU_VERIFIKASI: "#f59e0b",
  MAINTENANCE: "#f97316",
  RUSAK: "#ef4444",
  HILANG: "#64748b",
};

export function KondisiChart({ data }: { data: { kondisi: string; jumlah: number }[] }) {
  const router = useRouter();
  const chartData = data
    .map((d) => ({ name: KONDISI_LABEL[d.kondisi] ?? d.kondisi, value: d.jumlah, kondisi: d.kondisi }))
    .filter((d) => d.value > 0);
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.kondisi}
                fill={KONDISI_COLOR[entry.kondisi] ?? "#94a3b8"}
                cursor="pointer"
                onClick={() => router.push(`/inventaris?kondisi=${entry.kondisi}`)}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(value) => [`${value} unit`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full min-w-0 space-y-1.5">
        {chartData.map((d) => (
          <li key={d.kondisi}>
            <Link
              href={`/inventaris?kondisi=${d.kondisi}`}
              className="flex items-center justify-between gap-3 rounded-md px-1 py-0.5 text-xs transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: KONDISI_COLOR[d.kondisi] ?? "#94a3b8" }} />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {d.value}{" "}
                <span className="font-normal text-muted-foreground">({total ? Math.round((d.value / total) * 100) : 0}%)</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { KONDISI_LABEL, KONDISI_COLOR };
