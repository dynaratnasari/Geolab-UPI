export const CATEGORIES = [
  { nama: "Alat Survei & Geodesi", icon: "compass" },
  { nama: "UAV & Drone", icon: "plane" },
  { nama: "Komputer & Elektronik", icon: "monitor" },
  { nama: "Klimatologi & Cuaca", icon: "cloud-sun" },
  { nama: "Uji Tanah & Air", icon: "flask-conical" },
  { nama: "Geologi", icon: "mountain" },
  { nama: "Optik & Observasi", icon: "telescope" },
  { nama: "Multimedia & Dokumentasi", icon: "camera" },
  { nama: "Alat Bantu Lapangan", icon: "wrench" },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]["nama"];
