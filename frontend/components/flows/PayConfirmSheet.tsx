"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { AmountInput } from "@/components/AmountInput";
import { Spinner } from "@/components/ui/Spinner";
import { useSeal } from "@/lib/seal";
import { parseCUSD } from "@/lib/format";
import { shortAddr } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { PayRequestPayload } from "@/lib/payloads";

export function PayConfirmSheet({
  payload,
  open,
  onClose,
}: {
  payload: PayRequestPayload | null;
  open: boolean;
  onClose: () => void;
}) {
  const { pay, needsWallet, connect } = useSeal();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    setAmount("");
  }, [payload]);

  const close = () => {
    setAmount("");
    setDone(false);
    onClose();
  };

  const onPay = async () => {
    if (!payload) return;
    const value = parseCUSD(amount);
    if (value <= 0n) return toast.error("Enter an amount");
    setBusy(true);
    try {
      await pay(payload, value);
      setDone(true);
      toast.success("Payment sent", "Amount encrypted on-chain");
    } catch (e: any) {
      toast.error("Payment failed", e?.shortMessage ?? e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title={done ? undefined : "Confirm payment"}>
      {!payload ? null : done ? (
        <div className="flex flex-col items-center py-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/12"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            >
              <Check className="h-10 w-10 text-emerald-400" strokeWidth={2.25} />
            </motion.div>
          </motion.div>
          <h3 className="mt-5 text-xl font-bold tracking-tight">Sent confidentially</h3>
          <p className="mt-1.5 max-w-xs text-sm text-white/55">
            You paid {shortAddr(payload.a)}. The amount stays encrypted — the public ledger only shows that a transfer
            happened.
          </p>
          <button onClick={close} className="btn-primary mt-7 w-full">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card-inset row justify-between p-4">
            <div className="min-w-0">
              <p className="label">Paying</p>
              <p className="mt-1 truncate font-mono text-sm text-white tnum">{shortAddr(payload.a, 6)}</p>
            </div>
            {payload.m && <span className="pill ml-3 max-w-[50%] shrink-0 truncate">{payload.m}</span>}
          </div>

          <AmountInput value={amount} onChange={setAmount} />

          <div className="row gap-2.5 rounded-2xl border border-seal-500/20 bg-seal-500/[0.06] px-4 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-seal-400" strokeWidth={1.75} />
            <p className="text-xs leading-relaxed text-white/65">
              This amount is encrypted before it ever leaves your device.
            </p>
          </div>

          {needsWallet ? (
            <button onClick={connect} className="btn-primary w-full">
              Connect wallet to pay
            </button>
          ) : (
            <button onClick={onPay} disabled={busy} className="btn-primary w-full">
              {busy ? <Spinner /> : <ArrowRight className="h-5 w-5" strokeWidth={1.75} />}
              {busy ? "Encrypting & sending…" : "Pay confidentially"}
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
