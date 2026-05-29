"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";
import { appMode, type AppMode } from "./mode";
import { addresses } from "./contracts/addresses";
import { demo } from "./demo";
import { created } from "./created";
import { encodePayload, encodeLink } from "./payloads";
import type { PacketPayload, PayRequestPayload } from "./payloads";
import { generatePacketKey, equalSplit, luckySplit } from "./redpacket";
import * as live from "./actions";
import type { CreatePacketResult, PacketCard, PaymentCard } from "./types";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

interface SealContext {
  mode: AppMode;
  address?: Address;
  isConnected: boolean;
  needsWallet: boolean;
  connect: () => void;
  disconnect: () => void;
  // balance
  balance: bigint | null;
  balanceHidden: boolean;
  revealing: boolean;
  loadingBalance: boolean;
  refreshBalance: () => Promise<void>;
  revealBalance: () => Promise<void>;
  hideBalance: () => void;
  // actions
  faucet: () => Promise<void>;
  createPacket: (o: { total: bigint; count: number; mode: "equal" | "lucky"; memo: string }) => Promise<CreatePacketResult>;
  claim: (p: PacketPayload) => Promise<bigint>;
  pay: (p: PayRequestPayload, amount: bigint) => Promise<void>;
  grantPacketAuditor: (packetId: string, auditor: Address) => Promise<void>;
  // reads
  myPackets: () => PacketCard[];
  refreshPackets: () => Promise<void>;
  myPayments: () => PaymentCard[];
  resetDemo: () => void;
}

const Ctx = createContext<SealContext | null>(null);

export function useSeal(): SealContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSeal must be used inside <SealProvider>");
  return c;
}

export function SealProvider({ children }: { children: React.ReactNode }) {
  const mode = appMode();
  const isDemo = mode === "demo";

  const { address: wagmiAddress, isConnected } = useAccount();
  const { connectors, connect: wagmiConnect } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Subscribe to the demo store for reactive reads.
  const demoState = useSyncExternalStore(
    demo.subscribe,
    demo.getSnapshot,
    demo.getSnapshot,
  );
  // Subscribe to locally-remembered live packets (created on this device).
  const createdState = useSyncExternalStore(created.subscribe, created.getSnapshot, created.getSnapshot);

  const address = isDemo ? demoState.me : wagmiAddress;
  const needsWallet = !isDemo && !isConnected;

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    if (isDemo) {
      // value is "known" but stays hidden until revealed
      setBalance((b) => (balanceHidden ? b : demo.balanceOf(address)));
      return;
    }
    // live: nothing to prefetch except confirming handle exists
  }, [address, isDemo, balanceHidden]);

  const revealBalance = useCallback(async () => {
    if (!address) return;
    setRevealing(true);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 500)); // simulate re-encryption round-trip
        setBalance(demo.balanceOf(address));
      } else {
        const handle = await live.getBalanceHandle(address);
        const dec = await live.decryptHandles([{ handle, contractAddress: addresses.ConfidentialUSD }], address);
        setBalance(dec[handle] ?? 0n);
      }
      setBalanceHidden(false);
    } finally {
      setRevealing(false);
    }
  }, [address, isDemo]);

  const hideBalance = useCallback(() => {
    setBalanceHidden(true);
    setBalance(null);
  }, []);

  // Keep revealed demo balance live as the store changes.
  useEffect(() => {
    if (isDemo && !balanceHidden && address) setBalance(demo.balanceOf(address));
  }, [isDemo, balanceHidden, address, demoState]);

  const faucet = useCallback(async () => {
    if (!address) throw new Error("No wallet");
    if (isDemo) demo.faucet(address);
    else {
      setLoadingBalance(true);
      try {
        await live.faucet();
      } finally {
        setLoadingBalance(false);
      }
    }
  }, [address, isDemo]);

  const createPacket = useCallback<SealContext["createPacket"]>(
    async ({ total, count, mode: split, memo }) => {
      if (!address) throw new Error("No wallet");
      if (isDemo) {
        const p = demo.createPacket({ creator: address, total, count, mode: split, memo });
        const payload: PacketPayload = { t: "rp", v: ZERO, c: sepolia.id, p: p.id, k: p.authPriv, m: memo };
        return { packetId: p.id, code: encodePayload(payload), link: encodeLink(payload), authAddr: p.authAddr };
      }
      const key = generatePacketKey();
      const amounts = split === "lucky" ? luckySplit(total, count) : equalSplit(total, count);
      const id = await live.createPacketLive({ me: address, amounts, packetKey: key, memo });
      const payload: PacketPayload = { t: "rp", v: addresses.RedPacketVault, c: sepolia.id, p: id.toString(), k: key.privateKey, m: memo };
      const out: CreatePacketResult = { packetId: id.toString(), code: encodePayload(payload), link: encodeLink(payload), authAddr: key.address };
      created.add({
        id: id.toString(),
        chainId: sepolia.id,
        creator: address,
        memo,
        mode: split,
        count,
        claimed: 0,
        total: total.toString(),
        createdAt: Math.floor(Date.now() / 1000),
        share: { code: out.code, link: out.link, authAddr: out.authAddr },
      });
      return out;
    },
    [address, isDemo],
  );

  const claim = useCallback<SealContext["claim"]>(
    async (p) => {
      if (!address) throw new Error("No wallet");
      return isDemo ? demo.claim(p.p, address) : live.claimLive(p, address);
    },
    [address, isDemo],
  );

  const pay = useCallback<SealContext["pay"]>(
    async (p, amount) => {
      if (!address) throw new Error("No wallet");
      if (isDemo) demo.pay({ payer: address, recipient: p.a, amount, nonce: p.n, memo: p.m ?? "" });
      else await live.payLive(p, address, amount);
    },
    [address, isDemo],
  );

  const grantPacketAuditor = useCallback<SealContext["grantPacketAuditor"]>(
    async (packetId, auditor) => {
      if (isDemo) demo.grantPacketAuditor(packetId, auditor);
      else await live.grantPacketAuditorLive(BigInt(packetId), auditor);
    },
    [isDemo],
  );

  const myPackets = useCallback<SealContext["myPackets"]>(() => {
    if (!address) return [];
    if (isDemo)
      return demo.myPackets(address).map((p) => {
        const payload: PacketPayload = { t: "rp", v: ZERO, c: sepolia.id, p: p.id, k: p.authPriv, m: p.memo };
        return {
          id: p.id,
          memo: p.memo,
          count: p.slots.length,
          claimed: p.slots.filter((s) => s.claimed).length,
          createdAt: p.createdAt,
          mode: p.mode,
          isCreator: true,
          totalKnown: p.total,
          share: { code: encodePayload(payload), link: encodeLink(payload), authAddr: p.authAddr },
        };
      });
    return created.list(sepolia.id, address).map((p) => ({
      id: p.id,
      memo: p.memo,
      count: p.count,
      claimed: p.claimed,
      createdAt: p.createdAt,
      mode: p.mode,
      isCreator: true,
      totalKnown: BigInt(p.total),
      share: p.share,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isDemo, demoState, createdState]);

  const refreshPackets = useCallback<SealContext["refreshPackets"]>(async () => {
    if (isDemo || !address) return;
    const mine = created.list(sepolia.id, address);
    await Promise.all(
      mine.map(async (p) => {
        try {
          const v = await live.getPacketLive(BigInt(p.id));
          created.setClaimed(p.id, sepolia.id, v.claimed);
        } catch {
          /* packet may predate this contract — ignore */
        }
      }),
    );
  }, [address, isDemo]);

  const myPayments = useCallback<SealContext["myPayments"]>(() => {
    if (!address) return [];
    if (isDemo)
      return demo.myPayments(address).map((p) => ({
        id: p.id,
        payer: p.payer,
        recipient: p.recipient,
        memo: p.memo,
        ts: p.ts,
        direction: p.payer.toLowerCase() === address.toLowerCase() ? ("out" as const) : ("in" as const),
        amountKnown: p.amount,
      }));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isDemo, demoState]);

  const connect = useCallback(() => {
    const c = connectors[0];
    if (c) wagmiConnect({ connector: c });
  }, [connectors, wagmiConnect]);

  const value = useMemo<SealContext>(
    () => ({
      mode,
      address,
      isConnected: isDemo ? true : isConnected,
      needsWallet,
      connect,
      disconnect: () => wagmiDisconnect(),
      balance,
      balanceHidden,
      revealing,
      loadingBalance,
      refreshBalance,
      revealBalance,
      hideBalance,
      faucet,
      createPacket,
      claim,
      pay,
      grantPacketAuditor,
      myPackets,
      refreshPackets,
      myPayments,
      resetDemo: () => {
        demo.reset();
        hideBalance();
      },
    }),
    [
      mode, address, isDemo, isConnected, needsWallet, connect, wagmiDisconnect, balance, balanceHidden, revealing,
      loadingBalance, refreshBalance, revealBalance, hideBalance, faucet, createPacket, claim, pay, grantPacketAuditor,
      myPackets, refreshPackets, myPayments,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
