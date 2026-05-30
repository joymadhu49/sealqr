"use client";

import { Users, Sparkles, Equal, Lock } from "lucide-react";
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
          <p className="-mt-2 mb-5 text-sm leading-relaxed text-white/55">
            One link for everyone{memo ? ` · “${memo}”` : ""}. Post it to a group — the first{" "}
            <span className="font-semibold text-white/85">{count}</span> {count === 1 ? "person" : "people"} each grab a{" "}
            <span className="text-lucky-300">{mode === "equal" ? "fair" : "random"}</span> sealed amount. One claim per person.
          </p>

          <QRDisplay data={share.link} accent="lucky" caption="Scan or share to claim" />

          <div className="mt-6 space-y-2">
            <div className="card-inset flex items-start gap-3 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lucky-500/15">
                {mode === "equal" ? (
                  <Equal className="h-4 w-4 text-lucky-300" />
                ) : (
                  <Sparkles className="h-4 w-4 text-lucky-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Amounts stay sealed</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                  Encrypted on-chain — nobody (not even you) can see who got what unless you grant an auditor.
                </p>
              </div>
            </div>

            <div className="card-inset flex items-start gap-3 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                <Lock className="h-4 w-4 text-white/55" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Front-run resistant</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                  Each claim is cryptographically bound to the claimer&apos;s own wallet.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/40">
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
