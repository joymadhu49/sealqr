"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Eye, ShieldCheck, Gift, ArrowLeftRight, Lock, KeyRound } from "lucide-react";
import { useSeal } from "@/lib/seal";
import { demo } from "@/lib/demo";
import { auditableLive, decryptHandles } from "@/lib/actions";
import { formatCUSD, shortAddr } from "@/lib/format";
import { RevealValue } from "@/components/CipherText";
import { Spinner } from "@/components/ui/Spinner";

interface AuditItem {
  key: string;
  kind: "packet" | "payment";
  label: string;
  sub: string;
  reveal: () => Promise<bigint>;
}

export default function AuditPage() {
  const { mode, address } = useSeal();
  const isDemo = mode === "demo";

  const demoState = useSyncExternalStore(demo.subscribe, demo.getSnapshot, demo.getSnapshot);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    if (isDemo) {
      const list = demo.auditableFor(address).map((a): AuditItem => {
        if (a.kind === "packet") {
          const p = a.ref as any;
          return {
            key: `pk-${p.id}`,
            kind: "packet",
            label: p.memo || `Packet #${p.id}`,
            sub: `${p.slots.length} slots · by ${shortAddr(p.creator)}`,
            reveal: async () => {
              await new Promise((r) => setTimeout(r, 450));
              return p.total as bigint;
            },
          };
        }
        const pay = a.ref as any;
        return {
          key: `py-${pay.id}`,
          kind: "payment",
          label: pay.memo || `Payment #${pay.id}`,
          sub: `${shortAddr(pay.payer)} → ${shortAddr(pay.recipient)}`,
          reveal: async () => {
            await new Promise((r) => setTimeout(r, 450));
            return pay.amount as bigint;
          },
        };
      });
      setItems(list);
      return;
    }
    // live
    setLoading(true);
    auditableLive(address)
      .then((list) =>
        setItems(
          list.map((a) => ({
            key: `${a.kind}-${a.refId}`,
            kind: a.kind,
            label: a.label,
            sub: `granted by ${shortAddr(a.grantedBy)}`,
            reveal: async () => {
              const dec = await decryptHandles([{ handle: a.handle, contractAddress: a.contract }], address);
              return dec[a.handle] ?? 0n;
            },
          })),
        ),
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [address, isDemo, demoState]);

  return (
    <div className="space-y-6 pt-2">
      <div className="px-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Eye className="h-6 w-6 text-iris-400" /> Audit
        </h1>
        <p className="mt-1 text-sm text-white/50">Reconcile amounts you’ve been granted access to. Everyone else still sees nothing.</p>
      </div>

      <div className="card flex items-start gap-3 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-iris-500/15">
          <KeyRound className="h-5 w-5 text-iris-400" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Scoped view keys</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            A sender or org grants you decryption rights for specific packets or payments. You reconcile the real
            totals; the public ledger stays blind. {isDemo && "Tip: on the Packet tab, grant a packet’s auditor access to your own address, then reveal it here."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card grid place-items-center py-12">
          <Spinner className="h-6 w-6 text-iris-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]">
            <ShieldCheck className="h-6 w-6 text-white/40" />
          </div>
          <p className="text-sm text-white/55">Nothing to audit</p>
          <p className="text-xs text-white/35">When someone grants you access, it shows up here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it, i) => (
            <motion.div
              key={it.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <AuditRow item={it} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditRow({ item }: { item: AuditItem }) {
  const [value, setValue] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);

  const onReveal = async () => {
    setBusy(true);
    try {
      setValue(await item.reveal());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex items-center gap-3 p-4">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
          item.kind === "packet" ? "bg-lucky-gradient" : "bg-iris-gradient"
        }`}
      >
        {item.kind === "packet" ? <Gift className="h-5 w-5 text-white" /> : <ArrowLeftRight className="h-5 w-5 text-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{item.label}</p>
        <p className="truncate text-xs text-white/45">{item.sub}</p>
      </div>
      {value === null ? (
        <button onClick={onReveal} disabled={busy} className="btn-ghost px-3 py-2 text-xs">
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          Reveal
        </button>
      ) : (
        <span className="text-sm font-bold text-iris-400">
          <RevealValue>{formatCUSD(value)}</RevealValue>
        </span>
      )}
    </div>
  );
}
