"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, CameraOff, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScanResult = { type: "item" | "loan"; id: string; label: string };

export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const resolveCode = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setLookingUp(true);
      setLookupError(null);
      try {
        const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
        const data: ScanResult | { error: string } = await res.json();
        if (!res.ok || "error" in data) {
          setLookupError("error" in data ? data.error : "Kode tidak ditemukan.");
          busyRef.current = false;
          setLookingUp(false);
          return;
        }
        stopCamera();
        router.push(data.type === "item" ? `/inventaris/${data.id}` : `/peminjaman/${data.id}`);
      } catch {
        setLookupError("Gagal menghubungi server. Coba lagi.");
        busyRef.current = false;
        setLookingUp(false);
      }
    },
    [router, stopCamera],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && !busyRef.current) {
      resolveCode(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [resolveCode]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError("Tidak dapat mengakses kamera. Gunakan input kode manual di bawah.");
      setCameraActive(false);
    }
  }, [tick]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="relative aspect-square w-full max-w-sm mx-auto bg-slate-950 sm:aspect-video sm:max-w-none">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
              <div className="h-full w-full rounded-2xl border-2 border-dashed border-white/60" />
            </div>
          )}
          {!cameraActive && (
            <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 p-6 text-center">
              <CameraOff className="h-8 w-8 text-white/50" />
              <p className="text-sm text-white/70">{cameraError ?? "Memulai kamera..."}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {lookingUp ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mencari kode...
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" /> Arahkan kamera ke QR pada label alat atau kupon peminjaman.
              </>
            )}
          </p>
          {!cameraActive && (
            <Button size="sm" variant="outline" onClick={startCamera}>
              Coba Kamera Lagi
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <p className="mb-2 text-sm font-medium text-foreground">Atau masukkan kode manual</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) resolveCode(manualCode.trim());
          }}
        >
          <Input
            placeholder="Contoh: GL-014 atau PJM-2026-0001"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button type="submit" disabled={lookingUp || !manualCode.trim()}>
            <Search className="h-4 w-4" />
            Cari
          </Button>
        </form>
        {lookupError && <p className="mt-2 text-xs text-destructive">{lookupError}</p>}
      </div>
    </div>
  );
}
