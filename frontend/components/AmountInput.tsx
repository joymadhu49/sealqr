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
  const border = accent === "lucky" ? "focus-within:border-lucky-500/40" : "focus-within:border-seal-500/40";
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-baseline justify-center gap-2 overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900/70 px-4 py-6 transition focus-within:ring-2",
          border,
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
          className="w-full max-w-[7ch] bg-transparent text-center text-5xl font-bold tracking-tightest tnum text-white outline-none placeholder:text-white/20"
        />
        <span className="text-xl font-semibold text-white/40">cUSD</span>
      </div>
      <div className="flex gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            className={cn(
              "flex-1 rounded-xl border py-2 text-sm font-medium transition active:scale-95",
              value === q
                ? accent === "lucky"
                  ? "border-lucky-500/40 bg-lucky-500/10 text-lucky-300"
                  : "border-seal-500/40 bg-seal-500/10 text-seal-200"
                : "border-white/[0.08] bg-white/[0.03] text-white/65 hover:bg-white/[0.07]",
            )}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
