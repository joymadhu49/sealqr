"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline placeholder for a value that is encrypted on-chain and not yet revealed. */
export function CipherText({ className, dots = 5 }: { className?: string; dots?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 align-middle", className)}>
      <Lock className="h-[0.7em] w-[0.7em] opacity-50" />
      <span className="font-mono tracking-[0.15em]">{"•".repeat(dots)}</span>
    </span>
  );
}

export function RevealValue({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, filter: "blur(8px)", y: 4 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}
