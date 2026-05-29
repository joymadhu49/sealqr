import {
  encodePacked,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export interface PacketKey {
  privateKey: Hex;
  address: Address;
}

/** Generate the single ephemeral bearer keypair shared by a packet's QR/link. */
export function generatePacketKey(): PacketKey {
  const privateKey = generatePrivateKey();
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

/**
 * Equal split: distribute `total` across `count` slots as evenly as possible,
 * pushing the remainder into the first slots (deterministic, no value lost).
 */
export function equalSplit(total: bigint, count: number): bigint[] {
  const base = total / BigInt(count);
  let rem = total - base * BigInt(count);
  return Array.from({ length: count }, () => {
    let v = base;
    if (rem > 0n) {
      v += 1n;
      rem -= 1n;
    }
    return v;
  });
}

/**
 * Lucky / random split (the "blind box"). Every slot gets at least `minUnit`,
 * the rest is shared by random weights. Sums exactly to `total`.
 */
export function luckySplit(total: bigint, count: number, minUnit = 1n): bigint[] {
  if (count === 1) return [total];
  const floor = minUnit * BigInt(count);
  if (total <= floor) return equalSplit(total, count);
  const pool = total - floor;
  const weights = Array.from({ length: count }, () => Math.random() + 0.15);
  const sum = weights.reduce((a, b) => a + b, 0);
  const out = weights.map((w) => (pool * BigInt(Math.floor((w / sum) * 1e9))) / 1_000_000_000n);
  let assigned = out.reduce((a, b) => a + b, 0n);
  out[0] += pool - assigned; // give rounding dust to first slot
  return out.map((v) => v + minUnit);
}

/**
 * Recreate the on-chain claim digest and sign it with the packet's shared
 * ephemeral key, binding the claim to `claimer`. Matches:
 *   keccak256(abi.encodePacked(vault, packetId, claimer)).toEthSignedMessageHash()
 */
export async function signClaim(args: {
  packetPrivateKey: Hex;
  vault: Address;
  packetId: bigint;
  claimer: Address;
}): Promise<Hex> {
  const digest = keccak256(
    encodePacked(["address", "uint256", "address"], [args.vault, args.packetId, args.claimer]),
  );
  const account = privateKeyToAccount(args.packetPrivateKey);
  // signMessage with a raw 32-byte digest applies the EIP-191 prefix → toEthSignedMessageHash.
  return account.signMessage({ message: { raw: digest } });
}
