"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
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
    <div className="space-y-5 pt-2">
      <div className="px-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ScanLine className="h-6 w-6 text-seal-400" /> Scan
        </h1>
        <p className="mt-1 text-sm text-white/50">Point at a SealQR code to pay a request or claim a red packet.</p>
      </div>

      <QRScanner key={rescanKey} onResult={onResult} />

      <ClaimSheet payload={packet} open={!!packet} onClose={reset} />
      <PayConfirmSheet payload={payReq} open={!!payReq} onClose={reset} />
    </div>
  );
}
