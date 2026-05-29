"use client";

import { Users, Sparkles, Equal, ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { QRDisplay } from "@/components/QRDisplay";
import type { PacketShare } from "@/lib/types";

export function PacketQRSheet({
  open,
  onClose,
  share,
  memo,
  count,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  share: PacketShare | null;
  memo: string;
  count: number;
  mode?: "equal" | "lucky";
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Share your red packet">
      {share && (
        <>
          <p className="-mt-2 mb-4 text-sm text-white/55">
            One link for everyone{memo ? ` · “${memo}”` : ""}. Post it to a group — the first{" "}
            <span className="font-semibold text-white/80">{count}</span> {count === 1 ? "person" : "people"} each grab a{" "}
            {mode === "equal" ? "fair" : "random"} sealed amount. One claim per person.
          </p>

          <QRDisplay data={share.link} accent="lucky" caption="Scan or share to claim" />

          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-lucky-500/20 bg-lucky-500/[0.06] px-4 py-3">
            {mode === "equal" ? (
              <Equal className="h-4 w-4 shrink-0 text-lucky-400" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-lucky-400" />
            )}
            <p className="text-xs text-white/65">
              Amounts stay encrypted on-chain — nobody (not even you) can see who got what unless you grant an auditor.
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2 px-1 text-xs text-white/40">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Front-run resistant: each claim is cryptographically bound to the claimer&apos;s wallet.
          </div>

          <div className="mt-3 flex items-center gap-2 px-1 text-xs text-white/40">
            <Users className="h-3.5 w-3.5 shrink-0" /> Track claims anytime from the History tab.
          </div>
        </>
      )}
      <button onClick={onClose} className="btn-ghost mt-5 w-full">
        Done
      </button>
    </Sheet>
  );
}
