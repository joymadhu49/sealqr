"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { toastStore } from "@/lib/toast";

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-seal-400" />,
  error: <XCircle className="h-5 w-5 text-lucky-400" />,
  info: <Info className="h-5 w-5 text-iris-400" />,
};

export function Toaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.get,
    toastStore.get,
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/[0.08] bg-surface-raised/95 px-4 py-3 shadow-lift backdrop-blur-xl"
          >
            <div className="mt-0.5 shrink-0">{icons[t.kind]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.desc && <p className="mt-0.5 break-words text-xs text-white/55">{t.desc}</p>}
            </div>
            <button
              onClick={() => toastStore.dismiss(t.id)}
              className="shrink-0 rounded-lg p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
