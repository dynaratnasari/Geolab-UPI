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

const PIE_COLORS = ["#294269", "#10b981", "#f59e0b", "#a02439", "#51709e", "#64748b", "#7390ba"];

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
        <Bar dataKey="jumlah" fill="#294269" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
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
  const total = data.reduce((sum, d) => sum + d.jumlah, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
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
      <ul className="w-full min-w-0 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.prodi} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="truncate">{d.prodi}</span>
            </span>
            <span className="shrink-0 font-semibold text-foreground">
              {d.jumlah}{" "}
              <span className="font-normal text-muted-foreground">({total ? Math.round((d.jumlah / total) * 100) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
