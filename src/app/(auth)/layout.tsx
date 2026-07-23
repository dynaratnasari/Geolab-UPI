import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <Image src="/logo-geolab.png" alt="Lab Geografi UPI" width={130} height={91} className="h-12 w-auto object-contain" />
            <div className="h-8 w-px bg-border" />
            <Image
              src="/logo-upi.jpg"
              alt="Universitas Pendidikan Indonesia"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover ring-1 ring-border"
            />
          </div>
          <p className="text-xs text-muted-foreground">Monitoring Peminjaman dan Inventaris Laboratorium</p>
        </div>
        {children}
      </div>
    </div>
  );
}
