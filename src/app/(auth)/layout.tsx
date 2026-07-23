import { MapPin } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-upi-700 shadow-soft">
            <MapPin className="h-5.5 w-5.5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">GeoLab UPI</h1>
            <p className="text-xs text-muted-foreground">
              Monitoring Peminjaman dan Inventaris Laboratorium
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
