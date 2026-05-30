"use client";

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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            style={{ y: dragY, scale, opacity: sheetOpacity }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-white/[0.08] bg-surface-raised px-5 pb-6 pt-3 shadow-lift"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button onClick={onClose} className="rounded-xl p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white">
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
