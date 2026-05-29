export const CUSD_DECIMALS = 6;
const UNIT = 10n ** BigInt(CUSD_DECIMALS);

export function formatCUSD(amount: bigint, opts: { symbol?: boolean } = {}): string {
  const neg = amount < 0n;
  const a = neg ? -amount : amount;
  const whole = a / UNIT;
  const frac = a % UNIT;
  let fracStr = frac.toString().padStart(CUSD_DECIMALS, "0").replace(/0+$/, "");
  const wholeStr = whole.toLocaleString("en-US");
  const body = fracStr ? `${wholeStr}.${fracStr}` : wholeStr;
  return `${neg ? "-" : ""}${body}${opts.symbol === false ? "" : " cUSD"}`;
}

export function parseCUSD(input: string): bigint {
  const cleaned = input.trim().replace(/,/g, "");
  if (!cleaned || isNaN(Number(cleaned))) return 0n;
  const [whole, frac = ""] = cleaned.split(".");
  const fracPadded = (frac + "0".repeat(CUSD_DECIMALS)).slice(0, CUSD_DECIMALS);
  return BigInt(whole || "0") * UNIT + BigInt(fracPadded || "0");
}

export function shortAddr(addr?: string, size = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function timeAgo(ts: number): string {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
