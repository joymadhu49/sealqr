"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Lock, ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSeal } from "@/lib/seal";
import { formatCUSD } from "@/lib/format";
import { RevealValue } from "@/components/CipherText";
import { toast } from "@/lib/toast";
import type { PacketPayload } from "@/lib/payloads";

type Stage = "ready" | "claiming" | "claimed" | "revealed";

const CONFETTI = 10;

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
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([40, 30, 60]);
    } catch (e: any) {
      setStage("ready");
      toast.error("Claim failed", e?.shortMessage ?? e?.message);
    }
  };

  const opened = stage === "claimed" || stage === "revealed";

  return (
    <Sheet open={open} onClose={close} title={undefined}>
      {!payload ? null : (
        <div className="flex flex-col items-center py-4 text-center">
          {/* Envelope */}
          <div className="relative mb-6">
            {/* soft halo behind the packet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={opened ? { opacity: 1, scale: 1 } : { opacity: 0.55, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
              className="absolute inset-0 -z-10 rounded-full bg-lucky-500/25 blur-2xl"
            />
            <AnimatePresence>
              {opened && (
                <>
                  {[...Array(CONFETTI)].map((_, i) => {
                    const angle = (i / CONFETTI) * 6.283;
                    const dist = 78;
                    const colors = ["bg-gold-400", "bg-lucky-400", "bg-gold-300"];
                    return (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          scale: [0, 1, 1, 0.7],
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist,
                        }}
                        transition={{ duration: 1.1, delay: i * 0.045, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`absolute left-1/2 top-1/2 h-2 w-2 rounded-full ${colors[i % colors.length]}`}
                      />
                    );
                  })}
                </>
              )}
            </AnimatePresence>
            <motion.div
              animate={
                stage === "claiming"
                  ? { rotate: [0, -5, 5, -4, 4, 0] }
                  : opened
                    ? { scale: [1, 1.08, 1], rotate: 0 }
                    : { scale: 1, rotate: 0 }
              }
              transition={
                stage === "claiming"
                  ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                  : { type: "spring", stiffness: 240, damping: 18 }
              }
              className="relative grid h-28 w-28 place-items-center rounded-4xl bg-lucky-gradient shadow-glow-lucky"
            >
              <AnimatePresence mode="wait">
                {opened ? (
                  <motion.span
                    key="open"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Sparkles className="h-14 w-14 text-white" strokeWidth={1.75} />
                  </motion.span>
                ) : (
                  <motion.span key="closed" exit={{ opacity: 0, scale: 0.6 }}>
                    <Gift className="h-14 w-14 text-white" strokeWidth={1.75} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {stage === "ready" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full flex-col items-center"
            >
              <p className="label text-lucky-400">红包 · Red packet</p>
              <h3 className="mt-1.5 text-xl font-bold">You&apos;ve got a gift</h3>
              {payload.m && <p className="mt-1 text-sm text-white/65">“{payload.m}”</p>}
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/45">
                Someone sent you a confidential gift. The amount is sealed — nobody knows what&apos;s inside until you open it.
              </p>
              {needsWallet ? (
                <button onClick={connect} className="btn-lucky mt-6 w-full">
                  Connect wallet to claim
                </button>
              ) : (
                <button onClick={onClaim} disabled={stage !== "ready"} className="btn-lucky mt-6 w-full">
                  <Gift className="h-4 w-4" /> Open packet
                </button>
              )}
            </motion.div>
          )}

          {stage === "claiming" && (
            <>
              <h3 className="text-xl font-bold">Opening…</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                <Spinner className="h-4 w-4" /> Binding claim to your address
              </p>
            </>
          )}

          {opened && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="flex w-full flex-col items-center"
            >
              <p className="label text-emerald-400">You received</p>
              <div className="mt-3 text-5xl font-bold tracking-tight">
                {stage === "claimed" ? (
                  <button onClick={() => setStage("revealed")} className="inline-flex items-center gap-3 text-white/85 transition hover:text-white">
                    <Lock className="h-7 w-7 opacity-50" />
                    <span className="font-mono tracking-[0.18em]">••••</span>
                  </button>
                ) : (
                  <RevealValue>
                    <span className="bg-lucky-gradient bg-clip-text tnum text-transparent">
                      {amount !== null ? formatCUSD(amount, { symbol: false }) : "0"}
                    </span>
                    <span className="ml-2 text-2xl font-semibold text-white/40">cUSD</span>
                  </RevealValue>
                )}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
                {stage === "claimed" ? (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Hidden on-chain. Tap to reveal — only you can decrypt it.
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Visible only to you. The public ledger shows nothing.
                  </>
                )}
              </p>
              <button onClick={close} className="btn-ghost mt-6 w-full">
                Done
              </button>
            </motion.div>
          )}
        </div>
      )}
    </Sheet>
  );
}
