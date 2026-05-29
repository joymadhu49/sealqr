"use client";

import { useState } from "react";
import { Eye, EyeOff, Droplets, ShieldCheck } from "lucide-react";
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
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-seal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-iris-500/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <span className="pill">
          <ShieldCheck className="h-3.5 w-3.5 text-seal-400" />
          Confidential balance
        </span>
        <button
          onClick={() => (balanceHidden ? revealBalance() : hideBalance())}
          disabled={revealing}
          className={cn(
            "rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60",
            !balanceHidden && "ring-1 ring-seal-500/30",
          )}
          aria-label={balanceHidden ? "Reveal balance" : "Hide balance"}
          aria-pressed={!balanceHidden}
        >
          {revealing ? <Spinner className="h-4 w-4" /> : balanceHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-5 flex min-h-[3rem] items-end gap-2">
        {balanceHidden ? (
          <button onClick={revealBalance} className="text-left">
            <span className="text-4xl font-bold tracking-tight text-white/90">
              <CipherText dots={6} />
            </span>
            <span className="ml-2 align-middle text-base font-medium text-white/40">cUSD</span>
            <p className="mt-1 text-xs text-seal-400/90">{revealing ? "Decrypting…" : "Tap to reveal (decrypts only for you)"}</p>
          </button>
        ) : (
          <div>
            <span className="text-4xl font-bold tracking-tight text-white">
              <RevealValue>{balance !== null ? formatCUSD(balance, { symbol: false }) : "0"}</RevealValue>
            </span>
            <span className="ml-2 align-middle text-base font-medium text-white/40">cUSD</span>
            <p className="mt-1 text-xs text-white/35">Visible only on this device · encrypted on-chain</p>
          </div>
        )}
      </div>

      <button onClick={onFaucet} disabled={fauceting || loadingBalance} className="btn-ghost mt-5 w-full">
        {fauceting || loadingBalance ? <Spinner /> : <Droplets className="h-4 w-4 text-seal-400" />}
        Get test cUSD
      </button>
    </div>
  );
}
