"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Gift, ScanLine, QrCode, EyeOff, Zap } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { BalanceCard } from "@/components/BalanceCard";
import { CipherText } from "@/components/CipherText";
import { shortAddr, timeAgo } from "@/lib/format";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const, duration: 0.5 },
});

export default function HomePage() {
  const { myPayments, myPackets } = useSeal();
  const payments = myPayments();
  const packets = myPackets();
  const hasActivity = payments.length > 0 || packets.length > 0;

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)}>
        <BalanceCard />
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fade(1)} className="grid grid-cols-3 gap-3">
        <QuickAction href="/pay" icon={<QrCode className="h-5 w-5" />} label="Request" tint="seal" />
        <QuickAction href="/packet" icon={<Gift className="h-5 w-5" />} label="Red Packet" tint="lucky" />
        <QuickAction href="/scan" icon={<ScanLine className="h-5 w-5" />} label="Scan" tint="iris" />
      </motion.div>

      {/* Privacy explainer */}
      <motion.div {...fade(2)} className="card p-5">
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-seal-400" />
          <h3 className="text-sm font-semibold text-white">Every amount is encrypted</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          SealQR uses Zama FHE (ERC-7984 confidential tokens). The chain records that a payment happened — never how
          much. Only you can decrypt your own balance and transfers.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="pill"><Zap className="h-3 w-3 text-gold-400" /> FHEVM</span>
          <span className="pill">ERC-7984</span>
          <span className="pill">Front-run resistant</span>
        </div>
      </motion.div>

      {/* Activity */}
      <motion.div {...fade(3)}>
        <h3 className="mb-3 px-1 text-sm font-semibold text-white/80">Recent activity</h3>
        {!hasActivity ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]">
              <ScanLine className="h-6 w-6 text-white/40" />
            </div>
            <p className="text-sm text-white/55">No activity yet</p>
            <p className="text-xs text-white/35">Request a payment or send a red packet to get started.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {packets.map((p) => (
              <Link key={`pk-${p.id}`} href="/packet" className="card card-hover flex items-center gap-3 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lucky-gradient">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.memo || "Red packet"}</p>
                  <p className="text-xs text-white/45">
                    {p.claimed}/{p.count} claimed · {timeAgo(p.createdAt)}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold text-white/80">
                  <CipherText dots={5} />
                </div>
              </Link>
            ))}
            {payments.map((p) => (
              <div key={`py-${p.id}`} className="card flex items-center gap-3 p-4">
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
                <div className="text-right text-sm font-semibold text-white/80">
                  <CipherText dots={5} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  tint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tint: "seal" | "lucky" | "iris";
}) {
  const tints = {
    seal: "text-seal-400 group-hover:bg-seal-500/10",
    lucky: "text-lucky-400 group-hover:bg-lucky-500/10",
    iris: "text-iris-400 group-hover:bg-iris-500/10",
  };
  return (
    <Link href={href} className="group card card-hover flex flex-col items-center gap-2 px-2 py-4">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] transition ${tints[tint]}`}>
        {icon}
      </span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </Link>
  );
}
