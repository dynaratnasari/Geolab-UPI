"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function KategoriChart({ data }: { data: { nama: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nama"
          width={140}
          tick={{ fontSize: 11, fill: "#334155" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} unit`, ""]}
        />
        <Bar dataKey="jumlah" fill="#1d4ed8" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
