"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeftRight, Gift, ScanLine, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pay", label: "Pay", icon: ArrowLeftRight },
  { href: "/scan", label: "Scan", icon: ScanLine, center: true },
  { href: "/packet", label: "Packet", icon: Gift },
  { href: "/audit", label: "Audit", icon: Eye },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-3">
      <div className="relative flex items-center justify-between rounded-[26px] border border-white/[0.08] bg-surface-raised/85 px-2 py-2 shadow-lift backdrop-blur-2xl">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link key={t.href} href={t.href} className="relative -mt-8 flex flex-col items-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-seal-gradient shadow-glow ring-4 ring-ink-950 transition active:scale-95">
                  <Icon className="h-6 w-6 text-ink-950" strokeWidth={2.4} />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-seal-400">{t.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition",
                active ? "text-white" : "text-white/45 hover:text-white/70",
              )}
            >
              {active && (
                <motion.span
                  layoutId="navpill"
                  className="absolute inset-0 rounded-2xl bg-white/[0.06]"
                  transition={{ type: "spring", stiffness: 280, damping: 30 }}
                />
              )}
              <Icon className="relative h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="relative max-[339px]:hidden">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
