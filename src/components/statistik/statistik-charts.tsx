"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#1d4ed8", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b", "#3b82f6"];

export function LoansPerMonthChart({ data }: { data: { bulan: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} peminjaman`, ""]}
        />
        <Bar dataKey="jumlah" fill="#1d4ed8" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopItemsChart({ data }: { data: { nama: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="nama" width={140} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} unit dipinjam`, ""]}
        />
        <Bar dataKey="jumlah" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProdiChart({ data }: { data: { prodi: string; jumlah: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="jumlah" nameKey="prodi" innerRadius={50} outerRadius={80} paddingAngle={2} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={entry.prodi} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          formatter={(value) => [`${value} peminjaman`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
