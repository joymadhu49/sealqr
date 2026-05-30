"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Minus, Plus, Sparkles, Equal, Eye, EyeOff, Users, ShieldCheck, Share2, RefreshCw } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { AmountInput } from "@/components/AmountInput";
import { Spinner } from "@/components/ui/Spinner";
import { Sheet } from "@/components/ui/Sheet";
import { PacketQRSheet } from "@/components/flows/PacketQRSheet";
import { parseCUSD, formatCUSD, timeAgo } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { PacketCard, PacketShare } from "@/lib/types";
import { isAddress, type Address } from "viem";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.05 },
});

export default function PacketPage() {
  const { createPacket, myPackets, refreshPackets, grantPacketAuditor, needsWallet, connect } = useSeal();
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState(3);
  const [mode, setMode] = useState<"equal" | "lucky">("lucky");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState<{ share: PacketShare; memo: string; count: number; mode: "equal" | "lucky" } | null>(null);
  const [shareFor, setShareFor] = useState<PacketCard | null>(null);
  const [grantFor, setGrantFor] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const packets = myPackets();

  // Keep on-chain claim counts fresh while viewing.
  useEffect(() => {
    refreshPackets();
    const t = setInterval(refreshPackets, 15000);
    return () => clearInterval(t);
  }, [refreshPackets]);

  const onCreate = async () => {
    const total = parseCUSD(amount);
    if (total <= 0n) return toast.error("Enter a total amount");
    if (count < 1 || count > 50) return toast.error("1–50 packets");
    setBusy(true);
    try {
      const res = await createPacket({ total, count, mode, memo });
      setResult({ share: { code: res.code, link: res.link, authAddr: res.authAddr }, memo, count, mode });
      setAmount("");
      setMemo("");
      toast.success("Packet sealed", "Share the link with your group");
    } catch (e: any) {
      toast.error("Could not create", e?.shortMessage ?? e?.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleReveal = (id: string) =>
    setRevealed((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-6 pt-2">
      <motion.div {...fade(0)} className="px-1">
        <p className="label flex items-center gap-1.5 text-lucky-400">
          <Sparkles className="h-3.5 w-3.5" /> Red packet · 红包
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Send a sealed gift</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Fund one packet, share a single link, let the group grab it. Every amount stays encrypted.
        </p>
      </motion.div>

      {/* create card — lucky-red is the lead here */}
      <motion.div
        {...fade(1)}
        className="relative overflow-hidden rounded-3xl border border-lucky-500/20 bg-surface/90 p-6 shadow-card backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lucky-500/15 blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lucky-gradient shadow-glow-lucky">
              <Gift className="h-6 w-6 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">New red packet</p>
              <p className="text-xs text-white/45">Confidential · on-chain</p>
            </div>
          </div>

          <div>
            <label className="label">Total amount</label>
            <div className="mt-2">
              <AmountInput value={amount} onChange={setAmount} accent="lucky" />
            </div>
          </div>

          {/* count stepper */}
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-ink-900/70 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-white/40" />
              <div>
                <p className="text-sm font-medium text-white">Recipients</p>
                <p className="text-xs text-white/40">First {count} to scan claim a slot</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                aria-label="Fewer recipients"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white transition hover:border-white/[0.14] active:scale-90"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-lg font-bold tnum">{count}</span>
              <button
                onClick={() => setCount((c) => Math.min(50, c + 1))}
                aria-label="More recipients"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white transition hover:border-white/[0.14] active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* split mode */}
          <div>
            <label className="label">Split</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ModeBtn active={mode === "lucky"} onClick={() => setMode("lucky")} icon={<Sparkles className="h-4 w-4" />} title="Lucky" sub="Random blind box" />
              <ModeBtn active={mode === "equal"} onClick={() => setMode("equal")} icon={<Equal className="h-4 w-4" />} title="Equal" sub="Same for all" />
            </div>
          </div>

          <div>
            <label className="label">Message (optional)</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 40))}
              placeholder="Happy New Year! 🧧"
              className="input-base mt-2"
            />
          </div>

          {needsWallet ? (
            <button onClick={connect} className="btn-lucky w-full">Connect wallet</button>
          ) : (
            <button onClick={onCreate} disabled={busy} className="btn-lucky w-full">
              {busy ? <Spinner /> : <Gift className="h-4 w-4" />}
              {busy ? "Sealing & funding…" : `Seal packet for ${count} ${count === 1 ? "person" : "people"}`}
            </button>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
            <ShieldCheck className="h-3.5 w-3.5" /> Amounts encrypted with FHE — sealed even from you.
          </p>
        </div>
      </motion.div>

      {/* my packets */}
      {packets.length > 0 && (
        <motion.div {...fade(2)}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="label">Your packets</p>
            <button onClick={refreshPackets} aria-label="Refresh packets" className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition hover:border-white/[0.14] hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          <div className="space-y-2.5">
            {packets.map((p) => {
              const pct = p.count ? Math.round((p.claimed / p.count) * 100) : 0;
              const done = p.claimed >= p.count;
              const isRevealed = revealed.has(p.id);
              return (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lucky-gradient">
                      <Gift className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{p.memo || "Red packet"}</p>
                      <p className="text-xs text-white/45">
                        {p.mode === "lucky" ? "Lucky" : "Equal"} · {timeAgo(p.createdAt)}
                      </p>
                    </div>
                    {/* total — sealed until tapped */}
                    <button
                      onClick={() => toggleReveal(p.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold tnum text-white/80 transition hover:text-white"
                      title={isRevealed ? "Hide amount" : "Reveal amount"}
                    >
                      {isRevealed && p.totalKnown !== undefined ? (
                        <span>{formatCUSD(p.totalKnown)}</span>
                      ) : (
                        <span className="font-mono tracking-[0.2em] text-white/50">••••</span>
                      )}
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5 opacity-50" /> : <Eye className="h-3.5 w-3.5 opacity-50" />}
                    </button>
                  </div>

                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div
                        className={cn("h-full rounded-full", done ? "bg-emerald-500" : "bg-lucky-gradient")}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="text-xs font-medium tnum text-white/55">
                      {p.claimed}/{p.count} claimed
                    </span>
                  </div>

                  <div className="divider my-3.5" />

                  <div className="flex items-center gap-4">
                    {p.share && (
                      <button
                        onClick={() => setShareFor(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-lucky-300 transition hover:text-lucky-300/80"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share link
                      </button>
                    )}
                    <button
                      onClick={() => setGrantFor(p.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-seal-300 transition hover:text-seal-200"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Grant auditor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* QR sheet for a freshly-created packet */}
      <PacketQRSheet
        open={!!result}
        onClose={() => setResult(null)}
        share={result?.share ?? null}
        memo={result?.memo ?? ""}
        count={result?.count ?? 0}
        mode={result?.mode}
      />

      {/* QR sheet re-opened from history */}
      <PacketQRSheet
        open={!!shareFor}
        onClose={() => setShareFor(null)}
        share={shareFor?.share ?? null}
        memo={shareFor?.memo ?? ""}
        count={shareFor?.count ?? 0}
        mode={shareFor?.mode}
      />

      <GrantSheet packetId={grantFor} onClose={() => setGrantFor(null)} onGrant={grantPacketAuditor} />
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.98]",
        active ? "border-lucky-500/50 bg-lucky-500/10 shadow-glow-lucky" : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]",
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-sm font-semibold", active ? "text-lucky-300" : "text-white")}>
        {icon} {title}
      </span>
      <span className="text-xs text-white/45">{sub}</span>
    </button>
  );
}

function GrantSheet({
  packetId,
  onClose,
  onGrant,
}: {
  packetId: string | null;
  onClose: () => void;
  onGrant: (packetId: string, auditor: Address) => Promise<void>;
}) {
  const [addr, setAddr] = useState("");
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setAddr("");
    setStep("input");
    onClose();
  };

  const toConfirm = () => {
    if (!packetId) return;
    if (!isAddress(addr)) return toast.error("Enter a valid address");
    setStep("confirm");
  };

  const confirmGrant = async () => {
    if (!packetId) return;
    setBusy(true);
    try {
      await onGrant(packetId, addr as Address);
      toast.success("Auditor granted", "They can now decrypt this packet's amounts");
      setAddr("");
      setStep("input");
      onClose();
    } catch (e: any) {
      toast.error("Grant failed", e?.shortMessage ?? e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!packetId} onClose={close} title="Grant auditor access">
      <div className="space-y-4">
        <div className="card-inset flex items-start gap-3 p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-seal-500/15">
            <ShieldCheck className="h-4 w-4 text-seal-400" />
          </div>
          <p className="text-xs leading-relaxed text-white/65">
            Selective disclosure: the auditor gets a scoped key to decrypt totals and per-slot amounts for this packet
            only. The public still sees nothing.
          </p>
        </div>

        {step === "input" ? (
          <>
            <div>
              <label className="label">Auditor address</label>
              <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x…" className="input-base mt-2 font-mono text-sm" />
            </div>
            <button onClick={toConfirm} className="btn-primary w-full">
              <ShieldCheck className="h-4 w-4" /> Review grant
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="label">Granting decryption access to</p>
              <p className="mt-2 break-all rounded-2xl border border-seal-500/25 bg-seal-500/[0.06] px-4 py-3.5 font-mono text-xs leading-relaxed text-white/90">
                {addr}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Irreversible on-chain. Double-check every character.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep("input")} disabled={busy} className="btn-ghost w-full">
                Back
              </button>
              <button onClick={confirmGrant} disabled={busy} className="btn-primary w-full">
                {busy ? <Spinner /> : <ShieldCheck className="h-4 w-4" />} Confirm grant
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
