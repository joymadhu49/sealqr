"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, ScanLine, AlertCircle } from "lucide-react";
import { ClaimSheet } from "@/components/flows/ClaimSheet";
import { PayConfirmSheet } from "@/components/flows/PayConfirmSheet";
import { Spinner } from "@/components/ui/Spinner";
import { decodePayload, type PacketPayload, type PayRequestPayload } from "@/lib/payloads";

// Landing page for shared https links. The bearer code lives in the URL fragment
// (`/claim#sealqr:…`) so the secret never hits a server log. We read it client-side,
// decode it, and open the matching flow.
export default function ClaimPage() {
  const router = useRouter();
  const [packet, setPacket] = useState<PacketPayload | null>(null);
  const [payReq, setPayReq] = useState<PayRequestPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    // The bearer secret lives ONLY in the URL fragment (`#…`), which never reaches
    // a server log, the Referer header, or CDN access logs. Do not fall back to the
    // query string — that would silently bless secrets that DO leak server-side.
    const raw = (typeof window !== "undefined" ? window.location.hash : "").replace(/^#/, "");
    const p = raw ? decodePayload(decodeURIComponent(raw)) : null;
    if (!p) return setStatus("bad");
    // Scrub the secret out of the address bar so it doesn't linger in history.
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (p.t === "rp") setPacket(p);
    else setPayReq(p);
    setStatus("ok");
  }, []);

  const done = () => router.push("/");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-2 text-center">
      {status === "loading" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative grid h-16 w-16 place-items-center rounded-4xl bg-lucky-gradient shadow-glow-lucky">
            <motion.div
              animate={{ rotate: [0, -4, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            >
              <Gift className="h-8 w-8 text-white" strokeWidth={1.75} />
            </motion.div>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/55">
            <Spinner className="h-4 w-4" /> Opening your link…
          </p>
        </motion.div>
      )}

      {status === "bad" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card flex w-full max-w-sm flex-col items-center gap-3 p-8"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lucky-500/10">
            <AlertCircle className="h-6 w-6 text-lucky-400" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-bold">Invalid link</h2>
          <p className="max-w-xs text-sm leading-relaxed text-white/50">
            This SealQR link is malformed or incomplete. Ask the sender to share it again.
          </p>
          <button onClick={() => router.push("/scan")} className="btn-ghost mt-2">
            <ScanLine className="h-4 w-4" /> Scan a code instead
          </button>
        </motion.div>
      )}

      {status === "ok" && !packet && !payReq && (
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Gift className="h-8 w-8 text-lucky-400" strokeWidth={1.75} /> Loading your gift…
        </div>
      )}

      <ClaimSheet payload={packet} open={!!packet} onClose={done} />
      <PayConfirmSheet payload={payReq} open={!!payReq} onClose={done} />
    </div>
  );
}
