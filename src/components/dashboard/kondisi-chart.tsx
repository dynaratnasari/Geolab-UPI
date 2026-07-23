"use client";

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
  const chartData = data.map((d) => ({ name: KONDISI_LABEL[d.kondisi] ?? d.kondisi, value: d.jumlah, kondisi: d.kondisi }));

  return (
    <ResponsiveContainer width="100%" height={220}>
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
            <Cell key={entry.kondisi} fill={KONDISI_COLOR[entry.kondisi] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} unit`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { KONDISI_LABEL, KONDISI_COLOR };
