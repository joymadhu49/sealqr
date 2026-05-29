"use client";

import { Lock } from "lucide-react";

export function ZamaBadge() {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 pb-2 text-center">
      <div className="pixel-divider w-24" />
      <a
        href="https://www.zama.ai/protocol"
        target="_blank"
        rel="noopener noreferrer"
        className="pill-zama transition hover:brightness-110"
        aria-label="Powered by Zama FHEVM"
      >
        <Lock className="h-3 w-3" strokeWidth={2.4} />
        <span>Encrypted by Zama FHEVM</span>
      </a>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
        ERC-7984 · Confidential by default
      </p>
    </div>
  );
}
