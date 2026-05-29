"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, ScanLine, AlertCircle } from "lucide-react";
import { ClaimSheet } from "@/components/flows/ClaimSheet";
import { PayConfirmSheet } from "@/components/flows/PayConfirmSheet";
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
    const raw = (typeof window !== "undefined" ? window.location.hash || window.location.search : "").replace(/^[#?]/, "");
    const p = raw ? decodePayload(decodeURIComponent(raw)) : null;
    if (!p) return setStatus("bad");
    if (p.t === "rp") setPacket(p);
    else setPayReq(p);
    setStatus("ok");
  }, []);

  const done = () => router.push("/");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-2 text-center">
      {status === "loading" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/50">
          Opening…
        </motion.div>
      )}

      {status === "bad" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center gap-3 p-8"
        >
          <AlertCircle className="h-9 w-9 text-lucky-400" />
          <h2 className="text-lg font-bold">Invalid link</h2>
          <p className="max-w-xs text-sm text-white/50">
            This SealQR link is malformed or incomplete. Ask the sender to share it again.
          </p>
          <button onClick={() => router.push("/scan")} className="btn-ghost mt-2">
            <ScanLine className="h-4 w-4" /> Scan a code instead
          </button>
        </motion.div>
      )}

      {status === "ok" && !packet && !payReq && (
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Gift className="h-8 w-8 text-lucky-400" /> Loading your gift…
        </div>
      )}

      <ClaimSheet payload={packet} open={!!packet} onClose={done} />
      <PayConfirmSheet payload={payReq} open={!!payReq} onClose={done} />
    </div>
  );
}
