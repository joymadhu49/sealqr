"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScanLine, Gift, ArrowLeftRight } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { ClaimSheet } from "@/components/flows/ClaimSheet";
import { PayConfirmSheet } from "@/components/flows/PayConfirmSheet";
import type { PacketPayload, PayRequestPayload, SealPayload } from "@/lib/payloads";

export default function ScanPage() {
  const [packet, setPacket] = useState<PacketPayload | null>(null);
  const [payReq, setPayReq] = useState<PayRequestPayload | null>(null);
  const [rescanKey, setRescanKey] = useState(0);

  const onResult = (p: SealPayload) => {
    if (p.t === "rp") setPacket(p);
    else setPayReq(p);
  };

  const reset = () => {
    setPacket(null);
    setPayReq(null);
    setRescanKey((k) => k + 1); // remount scanner to scan again
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 pt-2"
    >
      <div className="px-1">
        <span className="label">Scan</span>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ScanLine className="h-6 w-6 text-seal-400" strokeWidth={1.75} /> Point &amp; pay
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          Aim at a SealQR code to settle a payment request or claim a red packet.
        </p>
      </div>

      <QRScanner key={rescanKey} onResult={onResult} />

      <div className="card-flat flex items-center gap-4 p-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-lucky-500/25 bg-lucky-500/10">
            <Gift className="h-4 w-4 text-lucky-400" strokeWidth={1.75} />
          </span>
          Red packets
        </div>
        <span className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-seal-500/25 bg-seal-500/10">
            <ArrowLeftRight className="h-4 w-4 text-seal-400" strokeWidth={1.75} />
          </span>
          Payment requests
        </div>
      </div>

      <ClaimSheet payload={packet} open={!!packet} onClose={reset} />
      <PayConfirmSheet payload={payReq} open={!!payReq} onClose={reset} />
    </motion.div>
  );
}
