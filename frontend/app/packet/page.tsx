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
      toast.success("Red packet funded", "One link · all amounts sealed");
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
      <div className="px-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Gift className="h-6 w-6 text-lucky-400" /> Red Packet
        </h1>
        <p className="mt-1 text-sm text-white/50">Fund one sealed gift, share a single link, let the group grab it.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="card space-y-5 p-6"
      >
        <div>
          <label className="label">Total amount</label>
          <div className="mt-2">
            <AmountInput value={amount} onChange={setAmount} accent="lucky" />
          </div>
        </div>

        {/* count stepper */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-white/40" />
            <span className="text-sm font-medium text-white/80">Recipients</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition active:scale-90"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(50, c + 1))}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition active:scale-90"
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
      </motion.div>

      {/* my packets */}
      {packets.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white/80">Your packets</h3>
            <button onClick={refreshPackets} className="inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white/70">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          <div className="space-y-2.5">
            {packets.map((p) => {
              const pct = p.count ? Math.round((p.claimed / p.count) * 100) : 0;
              const isRevealed = revealed.has(p.id);
              return (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lucky-gradient">
                      <Gift className="h-5 w-5 text-white" />
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
                      className="flex items-center gap-1.5 text-sm font-semibold text-white/80"
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

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-lucky-gradient transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-white/55">
                      {p.claimed}/{p.count} claimed
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    {p.share && (
                      <button
                        onClick={() => setShareFor(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-lucky-400 transition hover:text-lucky-400/80"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share link
                      </button>
                    )}
                    <button
                      onClick={() => setGrantFor(p.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-iris-400 transition hover:text-iris-400/80"
                    >
                      <Eye className="h-3.5 w-3.5" /> Grant auditor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
        "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition",
        active ? "border-lucky-500/50 bg-lucky-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-sm font-semibold", active ? "text-lucky-400" : "text-white")}>
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
        <div className="flex items-center gap-2 rounded-2xl border border-iris-500/20 bg-iris-500/[0.06] px-4 py-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-iris-400" />
          <p className="text-xs text-white/65">
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
              <Eye className="h-4 w-4" /> Grant access
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="label">You are about to grant decryption access to:</p>
              <p className="mt-2 break-all rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 font-mono text-xs text-white/85">
                {addr}
              </p>
              <p className="mt-2 text-xs text-white/45">
                This is irreversible on-chain. Double-check every character.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep("input")} disabled={busy} className="btn-ghost w-full">
                Cancel
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
