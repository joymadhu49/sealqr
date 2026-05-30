"use client";

import { useState } from "react";
import { Wallet, Copy, LogOut, RotateCcw, Check } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { shortAddr } from "@/lib/format";
import { copy } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/toast";

export function ConnectButton() {
  const { mode, address, isConnected, needsWallet, connect, disconnect, resetDemo } = useSeal();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (needsWallet) {
    return (
      <button
        onClick={() => {
          setConnecting(true);
          try {
            connect();
          } finally {
            setTimeout(() => setConnecting(false), 800);
          }
        }}
        className="btn-primary px-4 py-2.5 text-sm"
      >
        {connecting ? <Spinner /> : <Wallet className="h-4 w-4" />}
        Connect
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(52,211,153,0.55)]" />
        {shortAddr(address)}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Account">
        <div className="space-y-3">
          <div className="card flex items-center justify-between p-4">
            <div>
              <p className="label">{mode === "demo" ? "Demo identity" : "Connected"}</p>
              <p className="mt-1 font-mono text-sm text-white">{shortAddr(address, 6)}</p>
            </div>
            <button
              onClick={async () => {
                if (address) {
                  await copy(address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                  toast.success("Address copied");
                }
              }}
              className="btn-ghost px-3 py-2 text-sm"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {mode === "demo" ? (
            <button
              onClick={() => {
                resetDemo();
                setOpen(false);
                toast.info("Demo reset", "Fresh identity and empty balance");
              }}
              className="btn-ghost w-full"
            >
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </button>
          ) : (
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="btn-ghost w-full text-lucky-400"
            >
              <LogOut className="h-4 w-4" /> Disconnect
            </button>
          )}
        </div>
      </Sheet>
    </>
  );
}
