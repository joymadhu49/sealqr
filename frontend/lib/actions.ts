"use client";

import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  signTypedData,
  getPublicClient,
  getAccount,
  switchChain,
} from "wagmi/actions";
import { parseEventLogs, keccak256, encodePacked, type Address, type Hex } from "viem";
import { sepolia } from "wagmi/chains";
import { wagmiConfig } from "./wagmi";
import { addresses } from "./contracts/addresses";
import { confidentialUSDAbi, redPacketVaultAbi, confidentialPayAbi, auditRegistryAbi } from "./contracts/abi";
import { encryptAmount, encryptAmounts, userDecrypt, type DecryptItem } from "./fhevm";
import { signClaim, type PacketKey } from "./redpacket";
import type { PacketPayload, PayRequestPayload } from "./payloads";

// SealQR is a single-chain (Sepolia-only) app. Every read is pinned to this
// chain so it resolves through the configured Sepolia transport regardless of
// the wallet's active network; every write asserts against it (and ensureSepolia
// proactively switches the wallet first) so a tx can never silently land on the
// wrong chain — the root cause behind "balance/flows don't work after reconnect".
const CHAIN = sepolia.id;
const OPERATOR_WINDOW = 60 * 60 * 24 * 30; // 30 days

/** Raised when a pay request's one-time nonce has already been consumed on-chain. */
export class NonceUsedError extends Error {
  constructor() {
    super("This request has already been paid. Ask for a fresh code.");
    this.name = "NonceUsedError";
  }
}

const signer = (args: { domain: any; types: any; primaryType: string; message: any }) =>
  signTypedData(wagmiConfig, args as any) as Promise<Hex>;

/**
 * Make sure the connected wallet is actually on Sepolia before sending a tx.
 * Writes go through the injected/WalletConnect provider on the wallet's ACTIVE
 * chain; MetaMask defaults to mainnet, where the SealQR contracts don't exist,
 * so without this a faucet/create/claim/pay would broadcast to the wrong chain.
 */
async function ensureSepolia(): Promise<void> {
  const { isConnected, chainId } = getAccount(wagmiConfig);
  if (!isConnected || chainId === CHAIN) return;
  await switchChain(wagmiConfig, { chainId: CHAIN });
}

export async function decryptHandles(items: DecryptItem[], me: Address): Promise<Record<string, bigint>> {
  return userDecrypt(items, me, signer);
}

export async function getBalanceHandle(me: Address): Promise<Hex> {
  return (await readContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "confidentialBalanceOf",
    args: [me],
  })) as Hex;
}

export async function faucet(): Promise<void> {
  await ensureSepolia();
  const hash = await writeContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "faucet",
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
}

async function ensureOperator(me: Address, spender: Address): Promise<void> {
  const ok = (await readContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "isOperator",
    args: [me, spender],
  })) as boolean;
  if (ok) return;
  const until = Math.floor(Date.now() / 1000) + OPERATOR_WINDOW;
  const hash = await writeContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialUSDAbi,
    address: addresses.ConfidentialUSD,
    functionName: "setOperator",
    args: [spender, until],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
}

export async function createPacketLive(args: {
  me: Address;
  amounts: bigint[];
  packetKey: PacketKey;
  memo: string;
}): Promise<bigint> {
  await ensureSepolia();
  await ensureOperator(args.me, addresses.RedPacketVault);
  const { handles, inputProof } = await encryptAmounts(addresses.RedPacketVault, args.me, args.amounts);
  const hash = await writeContract(wagmiConfig, {
    chainId: CHAIN,
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "createPacket",
    args: [handles, inputProof, args.packetKey.address, args.memo],
  });
  const receipt = await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
  // Read the packetId from THIS tx's own PacketCreated event, not the global
  // nextPacketId counter: the counter advances when any other wallet creates a
  // packet between our confirmation and the read, so nextPacketId-1 could point
  // at someone else's packet and bake the wrong id into our QR/link.
  const events = parseEventLogs({ abi: redPacketVaultAbi, eventName: "PacketCreated", logs: receipt.logs });
  const ev = events.find((e) => e.address.toLowerCase() === addresses.RedPacketVault.toLowerCase());
  if (!ev) throw new Error("createPacket: PacketCreated event not found in receipt");
  return (ev.args as { packetId: bigint }).packetId;
}

export async function claimLive(payload: PacketPayload, me: Address): Promise<bigint> {
  const packetId = BigInt(payload.p);

  // Already claimed by this wallet? Don't send a doomed tx — just reveal the amount.
  const claimed = (await readContract(wagmiConfig, {
    chainId: CHAIN,
    abi: redPacketVaultAbi,
    address: payload.v,
    functionName: "hasClaimed",
    args: [packetId, me],
  })) as boolean;

  if (!claimed) {
    await ensureSepolia();
    const signature = await signClaim({ packetPrivateKey: payload.k, vault: payload.v, packetId, claimer: me });
    const hash = await writeContract(wagmiConfig, {
      chainId: CHAIN,
      abi: redPacketVaultAbi,
      address: payload.v,
      functionName: "claim",
      args: [packetId, signature],
    });
    await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
  }

  // Resolve the slot this wallet got + its encrypted amount, then decrypt for the user.
  const info = (await readContract(wagmiConfig, {
    chainId: CHAIN,
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
  // Stale/duplicate request guard: a pay QR carries a one-time nonce. If it was
  // already spent, fail fast with a clear message instead of doing the encrypt +
  // operator-approval + signature round-trip only to revert with "Pay: nonce used".
  // nonceKey(recipient, nonce) = keccak256(abi.encodePacked(recipient, nonce)) — matches ConfidentialPay.sol.
  const nonceK = keccak256(encodePacked(["address", "uint256"], [payload.a, BigInt(payload.n)]));
  const used = (await readContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialPayAbi,
    address: addresses.ConfidentialPay,
    functionName: "nonceUsed",
    args: [nonceK],
  })) as boolean;
  if (used) throw new NonceUsedError();

  await ensureSepolia();
  await ensureOperator(me, addresses.ConfidentialPay);
  const { handle, inputProof } = await encryptAmount(addresses.ConfidentialPay, me, amount);
  const hash = await writeContract(wagmiConfig, {
    chainId: CHAIN,
    abi: confidentialPayAbi,
    address: addresses.ConfidentialPay,
    functionName: "pay",
    args: [payload.a, BigInt(payload.n), handle, inputProof, payload.m ?? ""],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
}

/** Creator-side reveal of a packet's encrypted total (creator holds decrypt rights). */
export async function revealPacketTotalLive(totalHandle: Hex, me: Address): Promise<bigint> {
  const dec = await decryptHandles([{ handle: totalHandle, contractAddress: addresses.RedPacketVault }], me);
  return dec[totalHandle] ?? 0n;
}

export async function grantPacketAuditorLive(packetId: bigint, auditor: Address): Promise<void> {
  await ensureSepolia();
  const hash = await writeContract(wagmiConfig, {
    chainId: CHAIN,
    abi: redPacketVaultAbi,
    address: addresses.RedPacketVault,
    functionName: "grantAuditor",
    args: [packetId, auditor],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: CHAIN, hash });
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
    chainId: CHAIN,
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
  const pc = getPublicClient(wagmiConfig, { chainId: CHAIN });
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
    chainId: CHAIN,
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
        chainId: CHAIN,
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
