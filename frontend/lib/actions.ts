"use client";

import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  signTypedData,
  getPublicClient,
} from "wagmi/actions";
import type { Address, Hex } from "viem";
import { sepolia } from "wagmi/chains";
import { wagmiConfig } from "./wagmi";
import { addresses } from "./contracts/addresses";
import { confidentialUSDAbi, redPacketVaultAbi, confidentialPayAbi, auditRegistryAbi } from "./contracts/abi";
import { encryptAmount, encryptAmounts, userDecrypt, type DecryptItem } from "./fhevm";
import { signClaim, type PacketKey } from "./redpacket";
import type { PacketPayload, PayRequestPayload } from "./payloads";

const OPERATOR_WINDOW = 60 * 60 * 24 * 30; // 30 days

const signer = (args: { domain: any; types: any; primaryType: string; message: any }) =>
  signTypedData(wagmiConfig, args as any) as Promise<Hex>;

export async function decryptHandles(items: DecryptItem[], me: Address): Promise<Record<string, bigint>> {
  return userDecrypt(items, me, signer);
}

export async function getBalanceHandle(me: Address): Promise<Hex> {
  return (await readContract(wagmiConfig, {
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "confidentialBalanceOf",
    args: [me],
  })) as Hex;
}

export async function faucet(): Promise<void> {
  const hash = await writeContract(wagmiConfig, {
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "faucet",
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
}

async function ensureOperator(me: Address, spender: Address): Promise<void> {
  const ok = (await readContract(wagmiConfig, {
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "isOperator",
    args: [me, spender],
  })) as boolean;
  if (ok) return;
  const until = Math.floor(Date.now() / 1000) + OPERATOR_WINDOW;
  const hash = await writeContract(wagmiConfig, {
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "setOperator",
    args: [spender, until],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
}

export async function createPacketLive(args: {
  me: Address;
  amounts: bigint[];
  packetKey: PacketKey;
  memo: string;
}): Promise<bigint> {
  await ensureOperator(args.me, addresses.RedPacketVault);
  const { handles, inputProof } = await encryptAmounts(addresses.RedPacketVault, args.me, args.amounts);
  const hash = await writeContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "createPacket",
    args: [handles, inputProof, args.packetKey.address, args.memo],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  const next = (await readContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "nextPacketId",
  })) as bigint;
  return next - 1n;
}

export async function claimLive(payload: PacketPayload, me: Address): Promise<bigint> {
  const packetId = BigInt(payload.p);

  // Already claimed by this wallet? Don't send a doomed tx — just reveal the amount.
  const claimed = (await readContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: payload.v,
    functionName: "hasClaimed",
    args: [packetId, me],
  })) as boolean;

  if (!claimed) {
    const signature = await signClaim({ packetPrivateKey: payload.k, vault: payload.v, packetId, claimer: me });
    const hash = await writeContract(wagmiConfig, {
      abi: redPacketVaultAbi,
      address: payload.v,
      functionName: "claim",
      args: [packetId, signature],
    });
    await waitForTransactionReceipt(wagmiConfig, { hash });
  }

  // Resolve the slot this wallet got + its encrypted amount, then decrypt for the user.
  const info = (await readContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: payload.v,
    functionName: "claimInfo",
    args: [packetId, me],
  })) as readonly [boolean, number, Hex];
  const handle = info[2];
  const dec = await decryptHandles([{ handle, contractAddress: payload.v }], me);
  return dec[handle] ?? 0n;
}

export async function payLive(payload: PayRequestPayload, me: Address, amount: bigint): Promise<void> {
  await ensureOperator(me, addresses.ConfidentialPay);
  const { handle, inputProof } = await encryptAmount(addresses.ConfidentialPay, me, amount);
  const hash = await writeContract(wagmiConfig, {
    abi: confidentialPayAbi,
    address: addresses.ConfidentialPay,
    functionName: "pay",
    args: [payload.a, BigInt(payload.n), handle, inputProof, payload.m ?? ""],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
}

/** Creator-side reveal of a packet's encrypted total (creator holds decrypt rights). */
export async function revealPacketTotalLive(totalHandle: Hex, me: Address): Promise<bigint> {
  const dec = await decryptHandles([{ handle: totalHandle, contractAddress: addresses.RedPacketVault }], me);
  return dec[totalHandle] ?? 0n;
}

export async function grantPacketAuditorLive(packetId: bigint, auditor: Address): Promise<void> {
  const hash = await writeContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "grantAuditor",
    args: [packetId, auditor],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
}

export interface LivePacketView {
  id: bigint;
  creator: Address;
  count: number;
  claimed: number;
  createdAt: number;
  auth: Address;
  totalHandle: Hex;
  memo: string;
}

export async function getPacketLive(packetId: bigint): Promise<LivePacketView> {
  const r = (await readContract(wagmiConfig, {
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "getPacket",
    args: [packetId],
  })) as readonly [Address, number, number, bigint, Address, Hex, string];
  return {
    id: packetId,
    creator: r[0],
    count: Number(r[1]),
    claimed: Number(r[2]),
    createdAt: Number(r[3]),
    auth: r[4],
    totalHandle: r[5],
    memo: r[6],
  };
}

const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0");

export async function myPacketsLive(me: Address): Promise<LivePacketView[]> {
  const pc = getPublicClient(wagmiConfig, { chainId: sepolia.id });
  if (!pc) return [];
  const logs = await pc.getLogs({
    address: addresses.RedPacketVault,
    event: redPacketVaultAbi.find((x) => x.type === "event" && x.name === "PacketCreated") as any,
    args: { creator: me },
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
  });
  const ids = logs.map((l: any) => l.args.packetId as bigint);
  return Promise.all(ids.map(getPacketLive));
}

export interface AuditableItem {
  kind: "packet" | "payment";
  refId: string;
  contract: Address;
  handle: Hex;
  label: string;
  grantedBy: Address;
}

export async function auditableLive(me: Address): Promise<AuditableItem[]> {
  const grants = (await readContract(wagmiConfig, {
    abi: auditRegistryAbi,
    address: addresses.AuditRegistry,
    functionName: "grantsFor",
    args: [me],
  })) as readonly { source: Address; refId: bigint; grantedBy: Address; timestamp: bigint }[];

  const out: AuditableItem[] = [];
  for (const g of grants) {
    if (g.source.toLowerCase() === addresses.RedPacketVault.toLowerCase()) {
      const p = await getPacketLive(g.refId);
      out.push({ kind: "packet", refId: g.refId.toString(), contract: addresses.RedPacketVault, handle: p.totalHandle, label: p.memo || `Packet #${g.refId}`, grantedBy: g.grantedBy });
    } else if (g.source.toLowerCase() === addresses.ConfidentialPay.toLowerCase()) {
      const r = (await readContract(wagmiConfig, {
        abi: confidentialPayAbi,
        address: addresses.ConfidentialPay,
        functionName: "getPayment",
        args: [g.refId],
      })) as readonly [Address, Address, bigint, bigint, Hex, string];
      out.push({ kind: "payment", refId: g.refId.toString(), contract: addresses.ConfidentialPay, handle: r[4], label: r[5] || `Payment #${g.refId}`, grantedBy: g.grantedBy });
    }
  }
  return out;
}
