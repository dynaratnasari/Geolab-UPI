import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Boxes,
  MapPinned,
  ClipboardCheck,
  CalendarDays,
  FileBarChart,
  Users,
  BarChart3,
  QrCode,
  ArrowLeftRight,
  BookMarked,
  History,
  GraduationCap,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
}

// `href` omitted = feature is on the roadmap but not built in this phase yet
// (shown disabled with a "Segera" badge rather than a dead link).
export const NAV_CONFIG: Record<Role, NavItem[]> = {
  KEPALA_LAB: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inventaris", href: "/inventaris", icon: Boxes },
    { label: "Lokasi Penyimpanan", href: "/lokasi", icon: MapPinned },
    { label: "Approval", href: "/approval", icon: ClipboardCheck },
    { label: "Jadwal Praktikum", href: "/jadwal", icon: CalendarDays },
    { label: "Barang Masuk/Keluar", href: "/transaksi", icon: ArrowLeftRight },
    { label: "Kelola Pengguna", href: "/pengguna", icon: Users },
    { label: "Laporan", href: "/laporan", icon: FileBarChart },
    { label: "Statistik", href: "/statistik", icon: BarChart3 },
  ],
  DOSEN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inventaris", href: "/inventaris", icon: Boxes },
    { label: "Approval Peminjaman", href: "/approval", icon: ClipboardCheck },
    { label: "Jadwal Praktikum", href: "/jadwal", icon: CalendarDays },
    { label: "Monitoring Mahasiswa", href: "/monitoring-mahasiswa", icon: GraduationCap },
  ],
  LABORAN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inventaris", href: "/inventaris", icon: Boxes },
    { label: "Lokasi Penyimpanan", href: "/lokasi", icon: MapPinned },
    { label: "Approval & Serah Terima", href: "/approval", icon: ClipboardCheck },
    { label: "Scan QR", href: "/scan", icon: QrCode },
    { label: "Barang Masuk/Keluar", href: "/transaksi", icon: ArrowLeftRight },
  ],
  MAHASISWA: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inventaris", href: "/inventaris", icon: Boxes },
    { label: "Peminjaman", href: "/peminjaman", icon: BookMarked },
    { label: "Jadwal Praktikum", href: "/jadwal", icon: CalendarDays },
    { label: "Riwayat", href: "/peminjaman", icon: History },
  ],
};
