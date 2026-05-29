"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard } from "lucide-react";
import { decodePayload, type SealPayload } from "@/lib/payloads";
import { Spinner } from "@/components/ui/Spinner";

export function QRScanner({ onResult }: { onResult: (payload: SealPayload) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const handled = useRef(false);
  const lastSeen = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserQRCodeReader();
        // Prefer the rear camera for scanning; fall back to any camera.
        const constraints: MediaStreamConstraints = {
          video: { facingMode: { ideal: "environment" } },
        };
        const controls = await reader.decodeFromConstraints(constraints, video, (result) => {
          if (!result || handled.current) return;
          const text = result.getText();
          const payload = decodePayload(text);
          if (payload) {
            handled.current = true;
            controls.stop();
            onResult(payload);
          } else if (text !== lastSeen.current) {
            // A QR was read but it isn't a SealQR code — tell the user, keep scanning.
            lastSeen.current = text;
            setHint("That's a QR code, but not a SealQR. Keep pointing at a SealQR code.");
          }
        });
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Camera unavailable");
        setStarting(false);
      }
    };

    // Defer to next tick so React StrictMode's immediate unmount cancels this
    // run before it ever calls getUserMedia — prevents two concurrent camera
    // sessions racing on the same <video> (which leaves a blank/black frame).
    const timer = setTimeout(start, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onResult]);

  const submitManual = () => {
    const payload = decodePayload(manualText);
    if (payload) onResult(payload);
    else setError("That doesn't look like a SealQR code.");
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-4xl border border-white/10 bg-ink-900">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
        {/* viewfinder overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-8 rounded-3xl border-2 border-white/20" />
          <div className="absolute left-8 top-8 h-10 w-10 rounded-tl-3xl border-l-4 border-t-4 border-seal-400" />
          <div className="absolute right-8 top-8 h-10 w-10 rounded-tr-3xl border-r-4 border-t-4 border-seal-400" />
          <div className="absolute bottom-8 left-8 h-10 w-10 rounded-bl-3xl border-b-4 border-l-4 border-seal-400" />
          <div className="absolute bottom-8 right-8 h-10 w-10 rounded-br-3xl border-b-4 border-r-4 border-seal-400" />
        </div>
        {starting && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/80">
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Spinner className="h-6 w-6" />
              <span className="text-sm">Starting camera…</span>
            </div>
          </div>
        )}
        {error && !manual && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/90 px-8 text-center">
            <div className="flex flex-col items-center gap-2 text-white/70">
              <CameraOff className="h-7 w-7 text-lucky-400" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>

      {hint && !manual && <p className="text-center text-xs text-white/55">{hint}</p>}

      {!manual ? (
        <button onClick={() => setManual(true)} className="btn-ghost w-full text-sm">
          <Keyboard className="h-4 w-4" /> Enter code manually
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste sealqr:… code"
            rows={3}
            className="input-base resize-none font-mono text-xs"
          />
          {error && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-lucky-400">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setManualText("");
                  setError(null);
                }}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/70 transition hover:bg-white/[0.1]"
              >
                Clear
              </button>
            </div>
          )}
          <button onClick={submitManual} disabled={!manualText.trim()} className="btn-primary w-full">
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
