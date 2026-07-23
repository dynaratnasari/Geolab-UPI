// Ruangan names as they appear in "DAFTAR INVENTARIS ALAT LABORATORIUM GEOGRAFI UPI".
// Gedung is inferred (Prodi SIG/SaIG/Pend. Geografi sits under Gedung FPIPS UPI;
// "Lab Integrasi GIS" is explicitly at Gedung Pascasarjana UPI in the source PDF).
export const LOCATIONS = [
  { ruangan: "Lab PJ SIG Lt.4", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Lab Multimedia/Geo Fisik Lt.4", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Lab Geografi Teknik Lt.3", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Lab Integrasi GIS", gedung: "Gedung Pascasarjana UPI", lemari: null, rak: null },
  { ruangan: "Lab Survei Pemetaan Geosfer", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Lab Prodi Pendidikan Geografi", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Prodi SPIG", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
  { ruangan: "Prodi SaIG", gedung: "Gedung FPIPS UPI", lemari: null, rak: null },
] as const;

export type LocationName = (typeof LOCATIONS)[number]["ruangan"];
