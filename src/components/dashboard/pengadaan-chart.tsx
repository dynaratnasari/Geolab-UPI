"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PengadaanChart({ data }: { data: { tahun: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="tahun" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} unit`, "Pengadaan"]}
        />
        <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
