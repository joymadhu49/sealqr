"use client";

import { Wallet, QrCode, ChevronRight, ShieldCheck } from "lucide-react";
import type { Connector } from "wagmi";
import { useSeal } from "@/lib/seal";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";

function meta(c: Connector): { name: string; sub: string; wc: boolean } {
  const id = c.id?.toLowerCase() ?? "";
  const name = c.name ?? "Wallet";
  if (id.includes("walletconnect")) {
    return { name: "WalletConnect", sub: "Scan with any mobile wallet", wc: true };
  }
  // Injected — surface the detected wallet's real name when we have it.
  const friendly = !name || name.toLowerCase() === "injected" ? "Browser wallet" : name;
  return { name: friendly, sub: "MetaMask, Rabby & browser extensions", wc: false };
}

export function WalletSheet() {
  const { pickerOpen, closePicker, connectors, connectWith, connecting } = useSeal();

  return (
    <Sheet open={pickerOpen} onClose={closePicker} title="Connect a wallet">
      <div className="space-y-2.5">
        {connectors.map((c) => {
          const { name, sub, wc } = meta(c);
          return (
            <button
              key={c.uid}
              onClick={() => connectWith(c)}
              disabled={connecting}
              className="card card-hover flex w-full items-center gap-3.5 p-4 text-left disabled:opacity-60"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-seal-500/10 text-seal-300">
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon} alt="" className="h-6 w-6" />
                ) : wc ? (
                  <QrCode className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Wallet className="h-5 w-5" strokeWidth={1.75} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{name}</span>
                <span className="block truncate text-xs text-white/45">{sub}</span>
              </span>
              {connecting ? (
                <Spinner className="h-4 w-4 text-white/50" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-white/30" strokeWidth={1.75} />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        SealQR never holds your keys. Connect on Sepolia testnet.
      </p>
    </Sheet>
  );
}
