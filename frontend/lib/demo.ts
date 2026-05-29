"use client";

// In-memory + localStorage simulated backend. Amounts are stored in clear but the
// UI treats them as encrypted (hidden until "revealed"), faithfully reproducing the
// confidential UX without needing a testnet. Used when contracts aren't configured
// or NEXT_PUBLIC_DEMO=1.

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { equalSplit, luckySplit } from "./redpacket";

export interface DemoSlot {
  amount: bigint;
  claimed: boolean;
  claimer?: Address;
}
export interface DemoPacket {
  id: string;
  creator: Address;
  memo: string;
  mode: "equal" | "lucky";
  slots: DemoSlot[];
  authPriv: Hex; // single shared bearer key
  authAddr: Address;
  total: bigint;
  createdAt: number;
  auditors: Address[];
}
export interface DemoPayment {
  id: string;
  payer: Address;
  recipient: Address;
  amount: bigint;
  memo: string;
  nonce: string;
  ts: number;
  auditors: Address[];
}

interface DemoState {
  me: Address;
  balances: Record<string, string>; // address -> bigint string
  packets: DemoPacket[];
  payments: DemoPayment[];
  packetSeq: number;
  paymentSeq: number;
}

const KEY = "sealqr.demo.v1";
const listeners = new Set<() => void>();
let state: DemoState | null = null;
let snapshot: DemoState | null = null; // stable ref for useSyncExternalStore

function reviver(_k: string, v: any) {
  return typeof v === "string" && /^\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v;
}
function replacer(_k: string, v: any) {
  return typeof v === "bigint" ? v.toString() + "n" : v;
}

function fresh(): DemoState {
  const me = privateKeyToAccount(generatePrivateKey()).address;
  return { me, balances: {}, packets: [], payments: [], packetSeq: 1, paymentSeq: 1 };
}

function load(): DemoState {
  if (state) return state;
  if (typeof window === "undefined") return (state = fresh());
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw, reviver) as DemoState) : fresh();
  } catch {
    state = fresh();
  }
  return state;
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state, replacer));
  snapshot = { ...(state as DemoState) };
  listeners.forEach((l) => l());
}

function bal(addr: string): bigint {
  return BigInt(load().balances[addr.toLowerCase()] ?? "0");
}
function setBal(addr: string, v: bigint) {
  load().balances[addr.toLowerCase()] = v.toString();
}

export const demo = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): DemoState {
    if (!snapshot) snapshot = { ...load() };
    return snapshot;
  },
  me(): Address {
    return load().me;
  },
  reset() {
    state = fresh();
    persist();
  },
  balanceOf(addr: Address): bigint {
    return bal(addr);
  },
  faucet(addr: Address) {
    setBal(addr, bal(addr) + 100_000_000n);
    persist();
  },
  createPacket(args: {
    creator: Address;
    total: bigint;
    count: number;
    mode: "equal" | "lucky";
    memo: string;
  }): DemoPacket {
    const s = load();
    if (bal(args.creator) < args.total) throw new Error("Insufficient balance");
    const amounts = args.mode === "lucky" ? luckySplit(args.total, args.count) : equalSplit(args.total, args.count);
    const slots: DemoSlot[] = amounts.map((amount) => ({ amount, claimed: false }));
    const pk = generatePrivateKey();
    const packet: DemoPacket = {
      id: String(s.packetSeq++),
      creator: args.creator,
      memo: args.memo,
      mode: args.mode,
      slots,
      authPriv: pk,
      authAddr: privateKeyToAccount(pk).address,
      total: args.total,
      createdAt: Math.floor(Date.now() / 1000),
      auditors: [],
    };
    setBal(args.creator, bal(args.creator) - args.total);
    s.packets.unshift(packet);
    persist();
    return packet;
  },
  getPacket(id: string): DemoPacket | undefined {
    return load().packets.find((p) => p.id === id);
  },
  claim(packetId: string, claimer: Address): bigint {
    const p = demo.getPacket(packetId);
    if (!p) throw new Error("Packet not found");
    // One claim per wallet: if already claimed, just reveal what they got.
    const mine = p.slots.find((s) => s.claimer?.toLowerCase() === claimer.toLowerCase());
    if (mine) return mine.amount;
    // Otherwise grab the next free slot, first-come-first-served.
    const sl = p.slots.find((s) => !s.claimed);
    if (!sl) throw new Error("Packet is empty");
    sl.claimed = true;
    sl.claimer = claimer;
    setBal(claimer, bal(claimer) + sl.amount);
    persist();
    return sl.amount;
  },
  pay(args: { payer: Address; recipient: Address; amount: bigint; nonce: string; memo: string }): DemoPayment {
    const s = load();
    if (bal(args.payer) < args.amount) throw new Error("Insufficient balance");
    if (s.payments.some((p) => p.recipient.toLowerCase() === args.recipient.toLowerCase() && p.nonce === args.nonce))
      throw new Error("Nonce already used");
    setBal(args.payer, bal(args.payer) - args.amount);
    setBal(args.recipient, bal(args.recipient) + args.amount);
    const payment: DemoPayment = {
      id: String(s.paymentSeq++),
      payer: args.payer,
      recipient: args.recipient,
      amount: args.amount,
      memo: args.memo,
      nonce: args.nonce,
      ts: Math.floor(Date.now() / 1000),
      auditors: [],
    };
    s.payments.unshift(payment);
    persist();
    return payment;
  },
  grantPacketAuditor(packetId: string, auditor: Address) {
    const p = demo.getPacket(packetId);
    if (p && !p.auditors.includes(auditor)) {
      p.auditors.push(auditor);
      persist();
    }
  },
  myPackets(addr: Address): DemoPacket[] {
    return load().packets.filter((p) => p.creator.toLowerCase() === addr.toLowerCase());
  },
  myPayments(addr: Address): DemoPayment[] {
    return load().payments.filter(
      (p) => p.payer.toLowerCase() === addr.toLowerCase() || p.recipient.toLowerCase() === addr.toLowerCase(),
    );
  },
  auditableFor(addr: Address): { kind: "packet" | "payment"; ref: DemoPacket | DemoPayment }[] {
    const s = load();
    const out: { kind: "packet" | "payment"; ref: DemoPacket | DemoPayment }[] = [];
    for (const p of s.packets) if (p.auditors.some((a) => a.toLowerCase() === addr.toLowerCase())) out.push({ kind: "packet", ref: p });
    for (const p of s.payments) if (p.auditors.some((a) => a.toLowerCase() === addr.toLowerCase())) out.push({ kind: "payment", ref: p });
    return out;
  },
};
