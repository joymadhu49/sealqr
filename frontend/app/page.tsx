"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Gift, ScanLine, QrCode, ShieldCheck, ChevronRight, Inbox } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { BalanceCard } from "@/components/BalanceCard";
import { CipherText } from "@/components/CipherText";
import { shortAddr, timeAgo } from "@/lib/format";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const, duration: 0.5 },
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
        <QuickAction href="/pay" icon={<QrCode className="h-5 w-5" />} label="Request" accent />
        <QuickAction href="/packet" icon={<Gift className="h-5 w-5" />} label="Red Packet" lucky />
        <QuickAction href="/scan" icon={<ScanLine className="h-5 w-5" />} label="Scan" />
      </motion.div>

      {/* Privacy explainer */}
      <motion.div {...fade(2)} className="card p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-seal-500/12 text-seal-400">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">Every amount stays encrypted</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              The chain records that a payment happened — never how much. Only you can decrypt your own balance and
              transfers.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill-zama">FHEVM</span>
          <span className="pill-tag">ERC-7984</span>
          <span className="pill-tag">Front-run resistant</span>
        </div>
      </motion.div>

      {/* Activity */}
      <motion.div {...fade(3)}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="label">Recent activity</h3>
          {hasActivity && (
            <span className="text-[11px] font-medium text-white/35">
              {payments.length + packets.length} total
            </span>
          )}
        </div>

        {!hasActivity ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <Inbox className="h-6 w-6 text-white/40" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-white/70">No activity yet</p>
            <p className="max-w-[15rem] text-xs leading-relaxed text-white/40">
              Request a payment or send a red packet — your confidential history appears here.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            {packets.map((p, i) => (
              <ActivityRow key={`pk-${p.id}`} href="/packet" divider={i > 0}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lucky-gradient text-white">
                  <Gift className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.memo || "Red packet"}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {p.claimed}/{p.count} claimed · {timeAgo(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-white/70">
                  <CipherText dots={5} />
                  <ChevronRight className="h-4 w-4 text-white/25" />
                </div>
              </ActivityRow>
            ))}
            {payments.map((p, i) => (
              <ActivityRow key={`py-${p.id}`} divider={i > 0 || packets.length > 0}>
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                    p.direction === "in" ? "bg-emerald-500/12 text-emerald-400" : "bg-white/[0.05] text-white/65"
                  }`}
                >
                  {p.direction === "in" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {p.direction === "in" ? "Received" : "Sent"}
                    {p.memo ? <span className="font-normal text-white/55"> · {p.memo}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {p.direction === "in" ? shortAddr(p.payer) : shortAddr(p.recipient)} · {timeAgo(p.ts)}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-white/70">
                  <CipherText dots={5} />
                </div>
              </ActivityRow>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ActivityRow({
  children,
  href,
  divider,
}: {
  children: React.ReactNode;
  href?: string;
  divider?: boolean;
}) {
  const inner = <div className="row gap-3">{children}</div>;
  return (
    <>
      {divider && <div className="divider" />}
      {href ? (
        <Link href={href} className="block transition hover:bg-white/[0.03]">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </>
  );
}

function QuickAction({
  href,
  icon,
  label,
  accent,
  lucky,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  lucky?: boolean;
}) {
  const tile = accent
    ? "bg-seal-500/12 text-seal-400 group-hover:bg-seal-500/[0.18]"
    : lucky
      ? "bg-lucky-500/10 text-lucky-400 group-hover:bg-lucky-500/[0.16]"
      : "bg-white/[0.05] text-white/70 group-hover:bg-white/[0.08]";
  return (
    <Link href={href} className="group card card-hover flex flex-col items-center gap-2.5 px-2 py-5">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl transition ${tile}`}>{icon}</span>
      <span className="text-xs font-medium text-white/75">{label}</span>
    </Link>
  );
}
