# 🔒 SealQR — Confidential Payments by QR + Confidential Red Packets

> Pay people by **scanning a QR code** and send **red packets (红包)** where **every amount is encrypted on-chain** with Zama FHE (ERC-7984 confidential tokens). The public ledger sees that a payment happened — **never how much**.

**Built for:** Zama Developer Program — Mainnet Season 3 · *Composable Privacy Is the Key* (Special Bounty × TokenOps, UX-scored).

---

## ✨ What it does

| | Feature | Privacy |
|---|---|---|
| 💸 | **Pay-by-QR** — scan a friend's receive code, enter an amount, send a confidential ERC-7984 transfer | Amount encrypted before it leaves your device; never in the QR |
| 🧧 | **Red Packets** — fund N sealed gifts in one batched *confidential disperse*; equal or lucky (random "blind box") split | Per-slot amounts encrypted; nobody (not even the chain) sees a slot's value until the recipient reveals it for themselves |
| 🕵️ | **Selective disclosure** — grant a scoped view key so an auditor can reconcile real totals | Only the granted address can decrypt; the public still sees nothing |

Mobile-first PWA: camera scan, wallet connect, install-to-home-screen, one-tap reveal.

---

## 🔐 How the privacy works

- **Encrypted values, not hidden UI.** Balances and transfer amounts are `euint64` ciphertext handles via **ERC-7984** (OpenZeppelin Confidential Contracts) on Zama **FHEVM**. The contract does math on ciphertext; the chain stores only handles.
- **Per-user decryption.** Each party decrypts *only their own* values through the relayer's user-decryption flow (EIP-712 signature → re-encrypted to the user's key). No global decryption.
- **No amount in the QR.** QR codes carry only `{recipient, nonce}` (pay) or `{packetId, slot, bearer-secret}` (packet). Value lives encrypted on-chain → zero-knowledge by construction.
- **One-time spend.** Pay request nonces and packet slots are single-use, marked atomically in the claim/pay tx.

### Anti-front-running (the Week-1 security crux) — *decided: signature-bound claim*

A red-packet slot is bound to an **ephemeral address**. The slot's QR carries the matching **ephemeral private key**. To claim, the claimer's app signs **their own wallet address** with that key; the contract recovers the signer and binds the payout to `msg.sender`:

```solidity
digest = keccak256(abi.encodePacked(vault, packetId, slot, msg.sender)).toEthSignedMessageHash();
require(digest.recover(signature) == slotAuth[packetId][slot]);
```

A mempool watcher who copies the signature **cannot redirect funds to themselves** — the signed payload commits to the original claimer's address. Single transaction, no commit-reveal round-trip. *(This is the commit-reveal "bind to msg.sender" option from the plan, realised as a one-tx scheme.)*

### Confidential disperse (TokenOps model)

Funding a packet is **one batched confidential disperse**: the client splits a total into N encrypted per-slot amounts (equal *or* lucky — indistinguishable on-chain), encrypts them all in a **single input proof**, and `createPacket(...)` pulls the encrypted total via one `confidentialTransferFrom`. Equal vs. lucky is a pure client-side choice, so both modes ship for free.

---

## 🏗 Architecture

```
Mobile-first PWA (Next.js App Router + wagmi/viem + @zama-fhe/relayer-sdk)
  ├─ Pay:    generate receive QR  /  scan → encrypt amount → confidential transfer
  ├─ Packet: split + encrypt N amounts → 1 disperse → QR sheet  /  scan → claim → reveal own
  └─ Audit:  reveal totals you've been granted a scoped key for
        │
        ▼
ConfidentialUSD.sol   ERC-7984 confidential test stablecoin (cUSD) + faucet
RedPacketVault.sol    batched disperse · signature-bound claim · one-time slots · audit grant
ConfidentialPay.sol   pay-by-QR · one-time nonce · confidential transfer · audit grant
AuditRegistry.sol     transparent ledger of selective-disclosure grants
        │
        ▼
Zama FHEVM coprocessor on Sepolia (ACL / KMS / Coprocessor)
```

---

## 🚀 Quick start

```bash
pnpm install            # installs both workspaces

# Contracts
cd contracts
pnpm compile
pnpm test               # FHEVM mock — 4 passing (faucet, disperse+claim, audit, pay)

# Frontend (runs in DEMO mode out of the box — no testnet needed)
cd ../frontend
pnpm dev                # http://localhost:3000
```

**Demo mode** (default when contract addresses are unset, or `NEXT_PUBLIC_DEMO=1`) simulates the full backend in-memory with localStorage. Amounts are kept hidden in the UI exactly as on-chain, so the whole flow — fund, scan, claim, reveal, audit — is fully clickable on a phone without any wallet or gas. Perfect for the demo video.

### Going live on Sepolia

```bash
cd contracts
cp .env.example .env    # add PRIVATE_KEY + SEPOLIA_RPC_URL
pnpm deploy:sepolia     # writes addresses to frontend/lib/contracts/addresses.<chainId>.json
```

Copy the four addresses into `frontend/.env.local` (see `.env.example`) and the app switches to live FHEVM automatically. Get test cUSD with the in-app faucet.

---

## 🎬 Demo script (~45s)

1. Phone A shows a red-packet QR.
2. Phone B scans → **Open packet** → "You received 🔒 ••••".
3. Tap to reveal → amount appears **only for the claimer**.
4. Open Sepolia explorer → the tx exists, **no amount visible**.
5. Switch to Pay → scan a friend's receive QR → pay → same privacy.
6. Audit tab → reveal a granted total. Public still sees nothing.

---

## 🧰 Stack

- **Contracts:** Solidity 0.8.27, `@fhevm/solidity` 0.11, `@openzeppelin/confidential-contracts` 0.4 (ERC-7984), Hardhat + `@fhevm/hardhat-plugin`.
- **Frontend:** Next.js 14 (App Router, PWA), wagmi 2 / viem 2, `@zama-fhe/relayer-sdk` 0.4.1, `@zxing/browser` (scan), `qrcode` (generate), Tailwind + framer-motion.

### Build gotchas worth knowing

- Inherit **`ZamaEthereumConfig`** (chain-aware: mainnet / Sepolia / local), not a `SepoliaConfig` contract — the latter isn't exported by `@fhevm/solidity` 0.11.
- When a contract hands an `euint64` to another contract (vault/pay → token), grant **`FHE.allowTransient(handle, address(token))`** first, or the callee hits `ACLNotAllowed()`.
- `@fhevm/hardhat-plugin` 0.4.2 pins `@zama-fhe/relayer-sdk` to **exactly 0.4.1**.

---

## ✅ Submission checklist

- [x] Smart contracts (deploy script for Sepolia; addresses auto-exported to the frontend)
- [x] Mobile-first PWA frontend + repo
- [x] Confidential disperse for red-packet funding (batched encrypted slots)
- [x] Selective-disclosure / audit feature
- [x] Front-running mitigation decided and implemented
- [ ] 3-minute video (script above)

## 📁 Layout

```
sealqr/
├─ contracts/   Hardhat + FHEVM (4 contracts, tests, deploy)
├─ frontend/    Next.js PWA (demo + live modes)
└─ plan/        original PLAN.md
```

MIT.
