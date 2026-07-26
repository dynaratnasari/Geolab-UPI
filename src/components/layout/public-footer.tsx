export function PublicFooter() {
  return (
    <footer className="bg-upi-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left md:px-6">
        <div>
          <p className="text-sm font-semibold">GeoLab UPI</p>
          <p className="mt-1 text-xs text-white/60">Laboratorium Geografi, FPIPS — Universitas Pendidikan Indonesia</p>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} GeoLab UPI. Seluruh hak cipta dilindungi.</p>
      </div>
    </footer>
  );
}
