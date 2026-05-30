"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, Copy, LogOut, RotateCcw, Check } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { shortAddr } from "@/lib/format";
import { copy } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/toast";

export function ConnectButton() {
  const { mode, address, needsWallet, connect, connecting, disconnect, resetDemo } = useSeal();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (needsWallet) {
    return (
      <button onClick={connect} disabled={connecting} className="btn-primary px-4 py-2.5 text-sm">
        {connecting ? <Spinner /> : <Wallet className="h-4 w-4" />}
        {connecting ? "Connecting…" : "Connect"}
      </button>
    );
  }

  const onCopy = async () => {
    if (!address) return;
    try {
      await copy(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Address copied");
    } catch {
      toast.error("Couldn't copy address");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08] sm:px-3 sm:text-sm"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(52,211,153,0.55)]" />
        {shortAddr(address)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-2xl border border-white/[0.08] bg-surface-raised/95 p-2 shadow-lift backdrop-blur-xl"
          >
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="label">{mode === "demo" ? "Demo identity" : "Connected"}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-sm text-white">{shortAddr(address, 6)}</span>
                <button
                  onClick={onCopy}
                  aria-label="Copy address"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="my-1.5 h-px bg-white/[0.06]" />

            {mode === "demo" ? (
              <button
                onClick={() => {
                  resetDemo();
                  setOpen(false);
                  toast.info("Demo reset", "Fresh identity and empty balance");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.06]"
                role="menuitem"
              >
                <RotateCcw className="h-4 w-4 text-white/55" /> Reset demo data
              </button>
            ) : (
              <button
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lucky-300 transition hover:bg-lucky-500/10"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" /> Disconnect
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
