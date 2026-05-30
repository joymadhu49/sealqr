"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const dragY = useMotionValue(0);
  const scale = useTransform(dragY, (y) => (y > 0 ? 1 - y / 2000 : 1));
  const sheetOpacity = useTransform(dragY, (y) => (y > 0 ? 1 - y / 600 : 1));

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Keep the latest onClose without re-running the effect when its identity changes.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape-to-close + focus management: move focus into the sheet on open and
  // restore it to the trigger on close, so keyboard / screen-reader users can
  // actually operate (and dismiss) the modal.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Dialog"}
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            style={{ y: dragY, scale, opacity: sheetOpacity }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140) onClose();
            }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/[0.08] bg-surface-raised px-5 pb-6 pt-3 shadow-lift focus:outline-none"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 id={titleId} className="text-lg font-bold text-white">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
