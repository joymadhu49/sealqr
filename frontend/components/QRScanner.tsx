"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CameraOff, Keyboard, ScanLine, X } from "lucide-react";
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
      <div className="card relative aspect-square w-full overflow-hidden p-0">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />

        {/* Calm viewfinder overlay — corner guides + a single gliding scan line */}
        {!error && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-8 rounded-3xl border border-white/15" />
            {/* corner guides */}
            <div className="absolute left-8 top-8 h-9 w-9 rounded-tl-3xl border-l-2 border-t-2 border-seal-400" />
            <div className="absolute right-8 top-8 h-9 w-9 rounded-tr-3xl border-r-2 border-t-2 border-seal-400" />
            <div className="absolute bottom-8 left-8 h-9 w-9 rounded-bl-3xl border-b-2 border-l-2 border-seal-400" />
            <div className="absolute bottom-8 right-8 h-9 w-9 rounded-br-3xl border-b-2 border-r-2 border-seal-400" />
            {/* gentle scan line sweeping the framed area */}
            {!starting && (
              <div className="absolute inset-8 overflow-hidden rounded-3xl">
                <motion.div
                  initial={{ y: "0%" }}
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1], repeat: Infinity }}
                  className="h-px w-full bg-gradient-to-r from-transparent via-seal-400 to-transparent shadow-glow"
                />
              </div>
            )}
          </div>
        )}

        {starting && !error && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-white/60">
              <Spinner className="h-6 w-6 text-seal-400" />
              <span className="text-sm">Starting camera…</span>
            </div>
          </div>
        )}

        {error && !manual && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/90 px-8 text-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-lucky-500/30 bg-lucky-500/10">
                <CameraOff className="h-5 w-5 text-lucky-400" />
              </span>
              <p className="text-sm font-medium text-white">Camera unavailable</p>
              <p className="max-w-xs text-xs leading-relaxed text-white/50">{error}</p>
              <button onClick={() => setManual(true)} className="btn-ghost mt-1 px-4 py-2 text-xs">
                <Keyboard className="h-4 w-4" /> Enter code instead
              </button>
            </div>
          </div>
        )}
      </div>

      {!manual && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
          <ScanLine className="h-4 w-4 text-white/40" />
          {hint ?? "Center the SealQR code inside the frame."}
        </p>
      )}

      {!manual ? (
        <button onClick={() => setManual(true)} className="btn-ghost w-full text-sm">
          <Keyboard className="h-4 w-4" /> Enter code manually
        </button>
      ) : (
        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="label">Paste code</span>
            <button
              type="button"
              onClick={() => {
                setManual(false);
                setError(null);
                setManualText("");
              }}
              className="rounded-xl p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/[0.1]"
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
