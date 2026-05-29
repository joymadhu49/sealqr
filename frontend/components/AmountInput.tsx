"use client";

import { cn } from "@/lib/utils";

const QUICK = ["5", "10", "25", "100"];

export function AmountInput({
  value,
  onChange,
  accent = "seal",
}: {
  value: string;
  onChange: (v: string) => void;
  accent?: "seal" | "lucky";
}) {
  const ring = accent === "lucky" ? "focus-within:ring-lucky-500/15" : "focus-within:ring-seal-500/15";
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-baseline justify-center gap-2 overflow-hidden rounded-3xl border border-white/10 bg-ink-900/70 px-4 py-5 transition focus-within:border-white/20 focus-within:ring-2",
          ring,
        )}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if (v.split(".").length > 2) return;
            onChange(v);
          }}
          placeholder="0"
          className="w-full max-w-[7ch] bg-transparent text-center text-5xl font-bold tracking-tight text-white outline-none placeholder:text-white/20"
        />
        <span className="text-xl font-semibold text-white/40">cUSD</span>
      </div>
      <div className="flex gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
