# SealQR — Session Summary

_Last updated: 2026-05-29_

Confidential payments-by-QR + confidential red packets (红包) on Zama FHEVM / ERC-7984. Built from `plan/PLAN.md` for the Zama Developer Program (Special Bounty × TokenOps, UX-scored). Deadline **2026-07-07**.

---

## ✅ Done this session

### Contracts (`contracts/`) — compiled, 4/4 tests pass on FHEVM mock, **deployed to Sepolia**
- `ConfidentialUSD.sol` — ERC-7984 confidential stablecoin (cUSD, 6 decimals) + 100-cUSD/hour faucet
- `RedPacketVault.sol` — batched confidential disperse, signature-bound claim (front-run resistant), one-time slots, auditor grant
- `ConfidentialPay.sol` — pay-by-QR, one-time nonce, confidential transfer, auditor grant
- `AuditRegistry.sol` — transparent selective-disclosure grant ledger
- Hardhat + `@fhevm/hardhat-plugin`; deploy script auto-exports addresses to the frontend

### Frontend (`frontend/`) — Next.js 14 PWA, `pnpm build` green, wired to live Sepolia
- Pro mobile-first UI: dark "confidential" theme, glass cards, gradients, framer-motion, bottom-sheet flows, packet-open + blur-reveal animations, installable PWA
- Screens: Home (balance + activity), Pay (receive QR + history), Packet (create → QR sheet, equal/lucky, my-packets + auditor grant), Scan (camera → claim/pay), Audit (reveal granted amounts)
- Real integration: wagmi/viem (injected wallet), `@zama-fhe/relayer-sdk` 0.4.1 (encrypt + userDecrypt), `@zxing/browser` scan, `qrcode` gen
- **Demo mode** fallback (in-memory/localStorage) when addresses unset or `NEXT_PUBLIC_DEMO=1`

---

## 🌐 Deployed — Sepolia (chain 11155111)

| Contract | Address |
|---|---|
| ConfidentialUSD (cUSD) | `0x7FFFa824A92F580A10Af973Ff7C42707d05a5A50` |
| RedPacketVault | `0xCe9010e77Eee979FF00227893e87ecFf8Bd789d4` (v2 — one-link claim) |
| ConfidentialPay | `0x5BbF1539E658899B5A78cD80314207816d838FEC` |
| AuditRegistry | `0xFE54d9c9491Af74fD8f7BDA59Bf76745FE59B1cB` |

- **Live app (permanent):** https://frontend-beryl-eta-53.vercel.app (Vercel, public, HTTPS → camera + share links work on any phone)
- Deployer: `0xc6b5079b78Df9AA059ba0eb3c324901AD89e68C2`
- Vault v2 deploy block: `10947395` (old vault `0x581D…cf2c` retired — per-slot QR model)
- Addresses live in `frontend/.env.local` (+ Vercel project env) and `frontend/lib/contracts/addresses.11155111.json`
- Explorer: https://sepolia.etherscan.io/address/0xCe9010e77Eee979FF00227893e87ecFf8Bd789d4
- Vercel project: `joys-projects-99b5b538/frontend` — `vercel deploy --prod --yes` from `frontend/` to ship

---

## 🔑 Design decisions (PLAN open items resolved)
- **One link, many claimers (v2, WeChat 红包 style):** a packet has ONE shared ephemeral key. A single QR / https link is posted to a group; the first N wallets each grab the next free slot, **one claim per wallet** (`hasClaimed` mapping, `claim` auto-assigns `slot = p.claimed++`). Replaces the old per-slot-QR model.
- **Anti-front-run:** claimer signs their own wallet address with the shared key; contract `ecrecover`-binds payout to `msg.sender` (`keccak(vault, packetId, claimer)`). A replayed signature can't be redirected. One tx, no commit-reveal.
- **Shareable deep links:** QR encodes an `https://…/claim#sealqr:<code>` URL — opens in any phone's native camera/quick-scan and is shareable via Web Share/copy. Bearer code lives in the URL **fragment** so the secret key never reaches a server log. `/claim` page decodes client-side → opens claim/pay sheet.
- **Confidential disperse:** client splits total into N encrypted per-slot amounts (equal OR lucky), one input proof, single `createPacket` tx. Both split modes ship.
- **Token:** deployed own ERC-7984 cUSD with faucet.
- **Audit:** `FHE.allow(handle, auditor)` grants scoped decryption; auditor reveals via relayer userDecrypt.

---

## ▶️ Resume later
```bash
cd frontend && pnpm dev                          # http://localhost:3000 (live Sepolia)
cloudflared tunnel --url http://localhost:3000   # fresh HTTPS URL for phone (camera needs HTTPS)
```
Test loop: connect MetaMask (Sepolia) → Get test cUSD → reveal balance (EIP-712 sign → relayer decrypt) → seal packet → scan QR on 2nd device → open → reveal.

Background procs (dev server + tunnel) were **stopped** at end of session.

---

## ⏳ Remaining
- [ ] Record 3-min demo video (script in `README.md`)
- [ ] (Optional) Verify contracts on Etherscan — add `ETHERSCAN_API_KEY` to `contracts/.env`, run `hardhat verify`
- [ ] (Optional) Seed an on-chain packet/payment so the live app shows data on first load
- [ ] Submit: Builder Track and/or Special Bounty

## ⚠️ Build gotchas (so they aren't re-hit)
- Inherit `ZamaEthereumConfig` (chain-aware), not a `SepoliaConfig` contract — not exported by `@fhevm/solidity` 0.11.
- `FHE.allowTransient(handle, address(token))` before handing an euint to the token, or `ACLNotAllowed()`.
- `@fhevm/hardhat-plugin` 0.4.2 pins `@zama-fhe/relayer-sdk` to exactly `0.4.1`.
- Next.js: import core actions from `wagmi/actions`; alias `pino-pretty` + `@react-native-async-storage/async-storage` to `false`; relayer SDK is browser-only (`@zama-fhe/relayer-sdk/web`, `initSDK()` before `createInstance`).
