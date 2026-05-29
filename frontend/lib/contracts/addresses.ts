import type { Address } from "viem";

export const SEPOLIA_CHAIN_ID = 11155111;

export interface SealQRAddresses {
  ConfidentialUSD: Address;
  RedPacketVault: Address;
  ConfidentialPay: Address;
  AuditRegistry: Address;
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Addresses come from NEXT_PUBLIC_* env vars (set after `pnpm deploy:sepolia`,
 * which also writes addresses.<chainId>.json into this folder for reference).
 */
export const addresses: SealQRAddresses = {
  ConfidentialUSD: (process.env.NEXT_PUBLIC_CUSD_ADDRESS as Address) ?? ZERO,
  RedPacketVault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address) ?? ZERO,
  ConfidentialPay: (process.env.NEXT_PUBLIC_PAY_ADDRESS as Address) ?? ZERO,
  AuditRegistry: (process.env.NEXT_PUBLIC_AUDIT_ADDRESS as Address) ?? ZERO,
};

export const contractsConfigured = Object.values(addresses).every((a) => a !== ZERO);
