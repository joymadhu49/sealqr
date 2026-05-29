"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanLine, RefreshCw, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { encodePayload } from "@/lib/payloads";
import { QRDisplay } from "@/components/QRDisplay";
import { CipherText } from "@/components/CipherText";
import { shortAddr, timeAgo } from "@/lib/format";
import { sepolia } from "wagmi/chains";

function randomNonce(): string {
  const a = new Uint8Array(8);
  if (typeof crypto !== "undefined") crypto.getRandomValues(a);
  return BigInt("0x" + Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("")).toString();
}

export default function PayPage() {
  const { address, myPayments } = useSeal();
  const [memo, setMemo] = useState("");
  const [nonce, setNonce] = useState(() => randomNonce());

  const qr = useMemo(() => {
    if (!address) return "";
    return encodePayload({ t: "pay", a: address, c: sepolia.id, n: nonce, m: memo || undefined });
  }, [address, nonce, memo]);

  const payments = myPayments();

  return (
    <div className="space-y-6 pt-2">
      <div className="px-1">
        <h1 className="text-2xl font-bold tracking-tight">Get paid</h1>
        <p className="mt-1 text-sm text-white/50">Show this code. The payer enters the amount — it never appears in the QR code.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="card p-6"
      >
        {qr ? <QRDisplay data={qr} caption={`Request to ${shortAddr(address)}`} /> : null}

        <div className="mt-6 space-y-3">
          <div>
            <label className="label">What’s it for? (optional)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 40))}
              placeholder="Dinner, rent, coffee…"
              className="input-base mt-2"
            />
          </div>
          <button
            onClick={() => setNonce(randomNonce())}
            className="btn-ghost w-full text-sm"
          >
            <RefreshCw className="h-4 w-4" /> New code (one-time use)
          </button>
        </div>
      </motion.div>

      <Link href="/scan" className="card card-hover flex items-center gap-3 p-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-seal-gradient text-ink-950">
          <ScanLine className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Scan to pay someone</p>
          <p className="text-xs text-white/45">Pay a friend’s request confidentially</p>
        </div>
      </Link>

      {payments.length > 0 && (
        <div>
          <h3 className="mb-3 px-1 text-sm font-semibold text-white/80">Payments</h3>
          <div className="space-y-2.5">
            {payments.map((p) => (
              <div key={p.id} className="card flex items-center gap-3 p-4">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    p.direction === "in" ? "bg-seal-500/15 text-seal-400" : "bg-iris-500/15 text-iris-400"
                  }`}
                >
                  {p.direction === "in" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {p.direction === "in" ? "Received" : "Sent"} {p.memo ? `· ${p.memo}` : ""}
                  </p>
                  <p className="text-xs text-white/45">
                    {p.direction === "in" ? shortAddr(p.payer) : shortAddr(p.recipient)} · {timeAgo(p.ts)}
                  </p>
                </div>
                <CipherText dots={5} className="text-sm font-semibold text-white/80" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
