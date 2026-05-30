"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, ShieldCheck } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { formatCUSD } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { CipherText, RevealValue } from "@/components/CipherText";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function BalanceCard() {
  const { balance, balanceHidden, revealing, revealBalance, hideBalance, faucet, loadingBalance } = useSeal();
  const [fauceting, setFauceting] = useState(false);

  const onFaucet = async () => {
    setFauceting(true);
    try {
      await faucet();
      toast.success("Received 100 cUSD", "Encrypted to your balance");
    } catch (e: any) {
      toast.error("Faucet failed", e?.shortMessage ?? e?.message);
    } finally {
      setFauceting(false);
    }
  };

  return (
    <div className="card relative overflow-hidden p-6">
      {/* one calm accent bloom, top-right */}
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-seal-500/15 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
          <ShieldCheck className="h-3.5 w-3.5 text-seal-400" strokeWidth={2} />
          Confidential balance
        </span>
        <button
          onClick={() => (balanceHidden ? revealBalance() : hideBalance())}
          disabled={revealing}
          className={cn(
            "rounded-full border border-white/[0.08] bg-white/[0.04] p-2 text-white/65 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60",
            !balanceHidden && "border-seal-500/30 text-seal-300",
          )}
          aria-label={balanceHidden ? "Reveal balance" : "Hide balance"}
          aria-pressed={!balanceHidden}
        >
          {revealing ? <Spinner className="h-4 w-4" /> : balanceHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-6 flex min-h-[3.25rem] items-end gap-2">
        {balanceHidden ? (
          <button onClick={revealBalance} className="text-left">
            <span className="text-[2.75rem] font-bold leading-none tracking-tightest tnum text-white/90">
              <CipherText dots={6} />
            </span>
            <span className="ml-2 align-middle text-base font-medium text-white/40">cUSD</span>
            <p className="mt-2 text-xs text-seal-300/90">
              {revealing ? "Decrypting…" : "Tap to reveal · decrypts only for you"}
            </p>
          </button>
        ) : (
          <div>
            <span className="text-[2.75rem] font-bold leading-none tracking-tightest tnum text-white">
              <RevealValue>{balance !== null ? formatCUSD(balance, { symbol: false }) : "0"}</RevealValue>
            </span>
            <span className="ml-2 align-middle text-base font-medium text-white/40">cUSD</span>
            <p className="mt-2 text-xs text-white/35">Visible only on this device · encrypted on-chain</p>
          </div>
        )}
      </div>

      <button onClick={onFaucet} disabled={fauceting || loadingBalance} className="btn-ghost mt-6 w-full">
        {fauceting || loadingBalance ? <Spinner /> : <Plus className="h-4 w-4 text-seal-300" />}
        Add test cUSD
      </button>
    </div>
  );
}
