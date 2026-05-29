"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { ConnectButton } from "@/components/wallet/ConnectButton";

export function Header() {
  const { mode } = useSeal();
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center justify-between bg-ink-950/70 px-4 pb-3 pt-3 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-seal-gradient shadow-glow">
          <ShieldCheck className="h-5 w-5 text-ink-950" strokeWidth={2.4} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-bold tracking-tight text-white">SealQR</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-seal-400/80">
            {mode === "demo" ? "Demo Mode" : "Sepolia"}
          </span>
        </span>
      </Link>
      <ConnectButton />
    </header>
  );
}
