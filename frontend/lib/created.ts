"use client";

// Local memory of red packets THIS device created in live (on-chain) mode.
// The bearer code/link and creator-known total live only here so the History tab
// can re-share a packet and show "how much I created" without a decrypt round-trip.
// Claimed counts are refreshed from chain.

import type { Address } from "viem";
import type { PacketShare } from "./types";

export interface CreatedPacket {
  id: string;
  chainId: number;
  creator: Address;
  memo: string;
  mode: "equal" | "lucky";
  count: number;
  claimed: number;
  total: string; // bigint as string (creator-known)
  createdAt: number;
  share: PacketShare;
}

const KEY = "sealqr.created.v1";
const listeners = new Set<() => void>();
let cache: CreatedPacket[] | null = null;
let snapshot: CreatedPacket[] = [];

function read(): CreatedPacket[] {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = []);
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: CreatedPacket[]) {
  cache = next;
  snapshot = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export const created = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): CreatedPacket[] {
    if (!snapshot.length) snapshot = read();
    return snapshot;
  },
  add(p: CreatedPacket) {
    write([p, ...read().filter((x) => !(x.id === p.id && x.chainId === p.chainId))]);
  },
  list(chainId: number, creator?: Address): CreatedPacket[] {
    const me = creator?.toLowerCase();
    return read().filter((p) => p.chainId === chainId && (!me || p.creator.toLowerCase() === me));
  },
  setClaimed(id: string, chainId: number, claimed: number) {
    const list = read();
    const i = list.findIndex((p) => p.id === id && p.chainId === chainId);
    if (i >= 0 && list[i].claimed !== claimed) {
      const next = list.slice();
      next[i] = { ...next[i], claimed };
      write(next);
    }
  },
};
