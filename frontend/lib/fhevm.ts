"use client";

import { bytesToHex, type Address, type Hex } from "viem";

// The relayer SDK is browser-only (WASM). We load it lazily so it never touches
// the server bundle. Types are loose because the web entry has no shipped d.ts here.
type FhevmInstance = any;

let instancePromise: Promise<FhevmInstance> | null = null;

const RELAYER_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

async function loadInstance(): Promise<FhevmInstance> {
  if (typeof window === "undefined") throw new Error("FHE instance is client-only");
  const sdk = await import("@zama-fhe/relayer-sdk/web");
  // initSDK loads the TFHE/KMS WASM modules.
  if (typeof sdk.initSDK === "function") await sdk.initSDK();
  // Use a dedicated Sepolia RPC for ACL/KMS reads rather than the injected
  // provider: it is chain-agnostic (works even if the wallet sits on another
  // network) and lets WalletConnect sessions decrypt without a window.ethereum.
  const config: any = {
    ...sdk.SepoliaConfig,
    network: RELAYER_RPC ?? (sdk.SepoliaConfig as any)?.network,
  };
  return sdk.createInstance(config);
}

export function getFhevm(): Promise<FhevmInstance> {
  if (!instancePromise) {
    instancePromise = loadInstance().catch((e) => {
      // Never cache a *failed* load: a single transient relayer/WASM error would
      // otherwise stick to the singleton and break every future reveal until a
      // full page reload. Reset so the next call retries from scratch.
      instancePromise = null;
      throw e;
    });
  }
  return instancePromise;
}

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export interface EncryptedInput {
  handles: Hex[];
  inputProof: Hex;
}

/** Encrypt one or more uint64 amounts bound to (contract, user) in a single proof. */
export async function encryptAmounts(
  contractAddress: Address,
  userAddress: Address,
  amounts: bigint[],
): Promise<EncryptedInput> {
  const instance = await getFhevm();
  const buf = instance.createEncryptedInput(contractAddress, userAddress);
  for (const a of amounts) buf.add64(a);
  const enc = await buf.encrypt();
  const toHex = (v: Uint8Array | string): Hex => (typeof v === "string" ? (v as Hex) : bytesToHex(v));
  return {
    handles: (enc.handles as (Uint8Array | string)[]).map(toHex),
    inputProof: toHex(enc.inputProof),
  };
}

export async function encryptAmount(
  contractAddress: Address,
  userAddress: Address,
  amount: bigint,
): Promise<{ handle: Hex; inputProof: Hex }> {
  const { handles, inputProof } = await encryptAmounts(contractAddress, userAddress, [amount]);
  return { handle: handles[0], inputProof };
}

export interface DecryptItem {
  handle: Hex;
  contractAddress: Address;
}

type SignTypedDataFn = (args: {
  domain: any;
  types: any;
  primaryType: string;
  message: any;
}) => Promise<Hex>;

/**
 * Re-encryption / user-decryption flow: prove ownership via an EIP-712 signature,
 * then ask the relayer to return the clear values for handles the user is allowed to see.
 */
export async function userDecrypt(
  items: DecryptItem[],
  userAddress: Address,
  signTypedData: SignTypedDataFn,
): Promise<Record<string, bigint>> {
  const out: Record<string, bigint> = {};
  // Uninitialised handles decrypt to 0 and would error at the relayer — short-circuit.
  const real = items.filter((i) => i.handle && i.handle.toLowerCase() !== ZERO_HANDLE);
  for (const i of items) if (!real.includes(i)) out[i.handle] = 0n;
  if (real.length === 0) return out;

  const instance = await getFhevm();
  const keypair = instance.generateKeypair();
  const contractAddresses = Array.from(new Set(real.map((i) => i.contractAddress)));
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "7";

  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
  const types = { ...eip712.types };
  delete (types as any).EIP712Domain;

  const signature = await signTypedData({
    domain: eip712.domain,
    types,
    primaryType: "UserDecryptRequestVerification",
    message: eip712.message,
  });

  const result = await instance.userDecrypt(
    real.map((i) => ({ handle: i.handle, contractAddress: i.contractAddress })),
    keypair.privateKey,
    keypair.publicKey,
    signature.replace(/^0x/, ""),
    contractAddresses,
    userAddress,
    startTimeStamp,
    durationDays,
  );

  for (const i of real) {
    // The relayer SDK keys results by lowercase hex; tolerate either casing so a
    // mixed-case handle can never silently decrypt to 0.
    const v = result[i.handle.toLowerCase() as Hex] ?? result[i.handle];
    out[i.handle] = typeof v === "bigint" ? v : BigInt(v ?? 0);
  }
  return out;
}
