import type { Address, Hex } from "viem";

// Compact QR payloads. Amounts are NEVER encoded here — value lives encrypted
// on-chain. A payload only carries identifiers + the bearer secret.

export interface PacketPayload {
  t: "rp";
  v: Address; // vault address
  c: number; // chainId
  p: string; // packetId
  k: Hex; // shared ephemeral private key (bearer secret — one per packet)
  m?: string; // public memo
}

export interface PayRequestPayload {
  t: "pay";
  a: Address; // recipient
  c: number; // chainId
  n: string; // one-time nonce
  m?: string; // public memo / request label
}

export type SealPayload = PacketPayload | PayRequestPayload;

const PREFIX = "sealqr:";

function b64urlEncode(s: string): string {
  const b = typeof window === "undefined" ? Buffer.from(s, "utf8").toString("base64") : window.btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return typeof window === "undefined"
    ? Buffer.from(b, "base64").toString("utf8")
    : decodeURIComponent(escape(window.atob(b)));
}

/** Compact `sealqr:<code>` form — used as the bearer code itself. */
export function encodePayload(payload: SealPayload): string {
  return PREFIX + b64urlEncode(JSON.stringify(payload));
}

/**
 * Stable public base for share links. Points at the deployed app so links keep
 * working anywhere; falls back to the current origin in dev.
 */
export function appBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/**
 * Shareable https deep link. The bearer code lives in the URL *fragment* (`#…`)
 * so the secret key never reaches a server log — fragments stay client-side.
 * Opens in any phone's native camera/quick-scan, unlike a custom `sealqr:` scheme.
 */
export function encodeLink(payload: SealPayload): string {
  return `${appBaseUrl()}/claim#${encodePayload(payload)}`;
}

export function decodePayload(text: string): SealPayload | null {
  try {
    let raw = text.trim();
    if (raw.startsWith(PREFIX)) raw = raw.slice(PREFIX.length);
    // tolerate full deep-link URLs (code in path or #fragment)
    const m = raw.match(/sealqr:([A-Za-z0-9\-_]+)/);
    if (m) raw = m[1];
    const obj = JSON.parse(b64urlDecode(raw));
    if (obj && (obj.t === "rp" || obj.t === "pay")) return obj as SealPayload;
    return null;
  } catch {
    return null;
  }
}
