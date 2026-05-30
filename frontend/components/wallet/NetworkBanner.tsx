"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { Spinner } from "@/components/ui/Spinner";

/**
 * App-wide warning shown whenever the connected wallet is on a chain other than
 * Sepolia. SealQR auto-prompts a switch on connect, but if the user declines (or
 * later switches networks in their wallet) this gives a persistent, tappable
 * recovery so reads/writes don't fail silently.
 */
export function NetworkBanner() {
  const { wrongNetwork, switchToSepolia, switchingChain } = useSeal();
  return (
    <AnimatePresence initial={false}>
      {wrongNetwork && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden px-4"
          role="alert"
        >
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-400">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Wrong network</p>
              <p className="text-xs text-white/55">SealQR runs on Sepolia testnet. Switch to continue.</p>
            </div>
            <button
              onClick={switchToSepolia}
              disabled={switchingChain}
              className="grid shrink-0 place-items-center rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-semibold text-ink-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {switchingChain ? <Spinner className="h-4 w-4 text-ink-950" /> : "Switch"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
