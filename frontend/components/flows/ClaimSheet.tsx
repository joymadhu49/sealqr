"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Lock } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSeal } from "@/lib/seal";
import { formatCUSD } from "@/lib/format";
import { RevealValue } from "@/components/CipherText";
import { toast } from "@/lib/toast";
import type { PacketPayload } from "@/lib/payloads";

type Stage = "ready" | "claiming" | "claimed" | "revealed";

export function ClaimSheet({
  payload,
  open,
  onClose,
}: {
  payload: PacketPayload | null;
  open: boolean;
  onClose: () => void;
}) {
  const { claim, needsWallet, connect } = useSeal();
  const [stage, setStage] = useState<Stage>("ready");
  const [amount, setAmount] = useState<bigint | null>(null);

  const close = () => {
    setStage("ready");
    setAmount(null);
    onClose();
  };

  const onClaim = async () => {
    if (!payload) return;
    setStage("claiming");
    try {
      const got = await claim(payload);
      setAmount(got);
      setStage("claimed");
    } catch (e: any) {
      setStage("ready");
      toast.error("Claim failed", e?.shortMessage ?? e?.message);
    }
  };

  return (
    <Sheet open={open} onClose={close} title={undefined}>
      {!payload ? null : (
        <div className="flex flex-col items-center py-4 text-center">
          {/* Envelope */}
          <div className="relative mb-6">
            <AnimatePresence>
              {(stage === "claimed" || stage === "revealed") && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.8], x: Math.cos((i / 8) * 6.28) * 70, y: Math.sin((i / 8) * 6.28) * 70 }}
                      transition={{ duration: 1.1, delay: i * 0.07 }}
                      className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-gold-400"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
            <motion.div
              animate={stage === "claiming" ? { rotate: [0, -4, 4, -3, 0] } : {}}
              transition={{ repeat: stage === "claiming" ? Infinity : 0, duration: 0.6, ease: "easeInOut" }}
              className="grid h-28 w-28 place-items-center rounded-4xl bg-lucky-gradient shadow-[0_16px_50px_-12px_rgba(229,72,77,0.6)]"
            >
              {stage === "ready" || stage === "claiming" ? (
                <Gift className="h-14 w-14 text-white" strokeWidth={1.8} />
              ) : (
                <Sparkles className="h-14 w-14 text-white" strokeWidth={1.8} />
              )}
            </motion.div>
          </div>

          {stage === "ready" && (
            <>
              <h3 className="text-xl font-bold">Red Packet</h3>
              {payload.m && <p className="mt-1 text-sm text-white/55">“{payload.m}”</p>}
              <p className="mt-2 max-w-xs text-sm text-white/45">
                Someone sent you a confidential gift. The amount is sealed — nobody knows what’s inside until you open it.
              </p>
              {needsWallet ? (
                <button onClick={connect} className="btn-lucky mt-6 w-full">
                  Connect wallet to claim
                </button>
              ) : (
                <button onClick={onClaim} className="btn-lucky mt-6 w-full">
                  Open packet
                </button>
              )}
            </>
          )}

          {stage === "claiming" && (
            <>
              <h3 className="text-xl font-bold">Opening…</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                <Spinner className="h-4 w-4" /> Binding claim to your address
              </p>
            </>
          )}

          {(stage === "claimed" || stage === "revealed") && (
            <>
              <h3 className="text-xl font-bold">You received</h3>
              <div className="mt-3 text-5xl font-bold tracking-tight">
                {stage === "claimed" ? (
                  <button onClick={() => setStage("revealed")} className="inline-flex items-center gap-3 text-white/85">
                    <Lock className="h-7 w-7 opacity-50" />
                    <span className="font-mono tracking-[0.18em]">••••</span>
                  </button>
                ) : (
                  <RevealValue>
                    <span className="bg-lucky-gradient bg-clip-text text-transparent">
                      {amount !== null ? formatCUSD(amount, { symbol: false }) : "0"}
                    </span>
                    <span className="ml-2 text-2xl font-semibold text-white/40">cUSD</span>
                  </RevealValue>
                )}
              </div>
              <p className="mt-2 text-xs text-white/45">
                {stage === "claimed"
                  ? "Hidden on-chain. Tap to reveal — only you can decrypt it."
                  : "Visible only to you. The public ledger shows nothing."}
              </p>
              <button onClick={close} className="btn-ghost mt-6 w-full">
                Done
              </button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
