"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanLine, RefreshCw, ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
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

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.05 },
});

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
      <motion.div {...fade(0)} className="px-1">
        <p className="label">Receive</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Get paid</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Show this code. The payer enters the amount — it never appears in the QR.
        </p>
      </motion.div>

      <motion.div {...fade(1)} className="card p-7">
        {qr ? <QRDisplay data={qr} caption={`Request to ${shortAddr(address)}`} /> : null}

        <div className="mt-7 space-y-4">
          <div>
            <label className="label">What’s it for? (optional)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 40))}
              placeholder="Dinner, rent, coffee…"
              className="input-base mt-2"
            />
          </div>
          <button onClick={() => setNonce(randomNonce())} className="btn-ghost w-full text-sm">
            <RefreshCw className="h-5 w-5" strokeWidth={1.75} /> New code · one-time use
          </button>
        </div>
      </motion.div>

      <motion.div {...fade(2)}>
        <Link href="/scan" className="card card-hover row p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-seal-gradient text-ink-950">
            <ScanLine className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Scan to pay someone</p>
            <p className="text-xs text-white/45">Pay a friend’s request confidentially</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/30" strokeWidth={1.75} />
        </Link>
      </motion.div>

      {payments.length > 0 && (
        <motion.div {...fade(3)}>
          <h3 className="mb-3 px-1 text-sm font-semibold text-white/80">Activity</h3>
          <div className="card overflow-hidden p-0">
            {payments.map((p, i) => {
              const received = p.direction === "in";
              return (
                <div key={p.id}>
                  {i > 0 && <div className="divider" />}
                  <div className="row px-4 py-3.5">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                        received ? "bg-emerald-500/12 text-emerald-400" : "bg-white/[0.05] text-white/45"
                      }`}
                    >
                      {received ? (
                        <ArrowDownLeft className="h-5 w-5" strokeWidth={1.75} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {received ? "Received" : "Sent"}
                        {p.memo ? <span className="text-white/45"> · {p.memo}</span> : ""}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/45 tnum">
                        {received ? shortAddr(p.payer) : shortAddr(p.recipient)} · {timeAgo(p.ts)}
                      </p>
                    </div>
                    <CipherText
                      dots={5}
                      className={`shrink-0 text-sm font-semibold ${received ? "text-emerald-400" : "text-white/55"}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
