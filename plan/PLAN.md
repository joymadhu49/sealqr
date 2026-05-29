# SealQR — Confidential Payments by QR + Confidential Red Packets

**Target:** Zama Developer Program — Mainnet Season 3 ("Composable Privacy Is the Key")
**Deadline:** 2026-07-07 (23:59 AOE)
**Track:** Special Bounty × TokenOps (confidential disperse, UX-scored) + viable for Builder Track.

---

## 1. One-liner

A mobile-first app where people **pay each other by scanning a QR code** and **send red packets (红包)** — but every amount is **encrypted on-chain** using Zama FHE (ERC-7984 confidential tokens) and the **TokenOps SDK** for batch disperse. The public ledger sees that a payment happened, never how much, never to whom in detail.

---

## 2. Why it fits the program

- **Composable privacy:** confidential ERC-7984 token balances move across contracts (pay + red-packet vault) while staying encrypted.
- **TokenOps SDK:** red-packet funding = one batched **confidential disperse** into many claimable slots. Exactly the SDK's purpose.
- **Real-world:** everyday P2P payments + gifting. Concrete daily use, not a toy.
- **Selective disclosure:** sender/auditor can be granted a scoped view key to reconcile totals without public exposure (TokenOps' compliance differentiator — Basel/MiFID style).
- **UX demo:** scan → pay/claim → "amount hidden" on a phone. Special Bounty is judged primarily on UX/frontend; this is built for that.

---

## 3. Core Features

### Feature A — Confidential P2P Pay-by-QR (everyday payments)
- Each user has a wallet + a personal **receive QR** (their address + optional request).
- **Request-to-pay:** receiver generates a QR encoding `{recipient, optionalAmount, memo, nonce}`. Amount is NOT readable from the QR; it lives encrypted on-chain.
- Payer scans → confirms → sends a **confidential transfer** (ERC-7984). Amount encrypted on-chain.
- Each party decrypts **only their own** balance via re-encryption.
- Use case: split a bill, pay a friend, daily spending — like a privacy Venmo/Alipay.

### Feature B — Confidential Red Packet (红包)
- Sender funds a packet for N claimers with a total (encrypted). Two modes:
  - **Equal split** — each claimer gets total/N.
  - **Lucky/random split** — amounts randomized (the "blind box": you don't know what you got till you claim; on-chain nobody sees it either).
- Funding = single batched **TokenOps confidential disperse** into N sealed slots.
- Each slot → a QR `{packetId, claimSecret}`. Share QR (print, DM, group chat, event screen).
- Claimer scans → wallet connect → `claim(packetId, secret)` → encrypted amount transfers to them.
- One-time claim per slot; spent slots marked.

### Feature C — Selective Disclosure (audit/reconcile)
- Sender (or org/auditor) can hold a **scoped view key** to decrypt totals + per-slot amounts for their own packets/payments.
- Public + other users see nothing. Meets the TokenOps compliance story.

---

## 4. Security crux (decide Week 1)

- **Claim front-running:** if `claimSecret` is visible in the mempool, a watcher can steal the claim. Mitigation options:
  - Commit–reveal: store `hash(secret)` on-chain; claim binds the reveal to `msg.sender` so a stolen secret is useless to anyone else, **or**
  - Submit the secret as an encrypted input to the contract.
  - **Decision required before any contract is finalized.**
- **No amount in QR:** QR carries only `{id, secret}` or `{recipient, nonce}`. Value stays encrypted on-chain → true zero-knowledge from the code itself.
- **One-time spend:** each slot/request nonce single-use; mark spent atomically in the claim/pay tx.
- **No custom crypto:** rely on audited ERC-7984 + TokenOps SDK. Do not hand-roll FHE primitives.

---

## 5. Architecture

```
Mobile-first Frontend (Next.js + PWA, camera QR scan, wallet connect)
  ├─ Pay:      generate receive QR  /  scan → confidential transfer
  ├─ Packet:   fund batch → QR sheet  /  scan → claim → decrypt own
  └─ Audit:    enter view key → reconcile totals + per-slot
        │
        ▼
ConfidentialPay.sol  ── confidential transfer (ERC-7984), request nonces
RedPacketVault.sol   ── fund via TokenOps disperse, claim(id, secret),
                        encrypted amounts (euint), one-time spend
AuditRegistry.sol    ── scoped view-key grants / selective decrypt
        │
        ▼
ERC-7984 confidential stablecoin (cUSDT) on Sepolia testnet
```

---

## 6. Tech Stack

- **Contracts:** Solidity + Zama FHEVM (`euint`, `ebool`, FHE select), ERC-7984, TokenOps SDK.
- **Tooling:** Hardhat, Zama FHEVM plugin, deploy to **Sepolia**.
- **Frontend:** Next.js (App Router) + PWA, wallet connect (wagmi/viem), camera QR scan (`html5-qrcode` or `@zxing/browser`), QR generation (`qrcode`).
- **Decrypt:** Zama re-encryption / user decrypt flow for own-balance reveal.
- **Pkg manager:** pnpm.

---

## 7. Milestones (≈5 weeks to 2026-07-07)

| Week | Deliverable |
|------|-------------|
| 1 | FHEVM + TokenOps SDK setup. Deploy sample ERC-7984 + run a disperse on Sepolia. **Lock claim-secret / anti-front-run scheme (commit-reveal vs encrypted input).** |
| 2 | `RedPacketVault.sol`: fund batch via TokenOps disperse, encrypted amounts, `claim(id, secret)` one-time spend + nonce. Equal-split mode. Unit tests. |
| 3 | `ConfidentialPay.sol`: request-to-pay nonces + confidential transfer. `AuditRegistry.sol`: scoped view-key grant + reconcile. Re-encryption path for self-decrypt. |
| 4 | Frontend core: receive-QR + scan-to-pay flow; packet fund + QR sheet; **camera scan → claim**; own-balance decrypt. Test on a real phone. |
| 5 | Lucky/random split mode, auditor view, mobile/PWA polish, docs, **3-min video**. Buffer for bugs. |

**Stretch (only if ahead):** merchant static POS QR, multi-token, recurring/daily auto-pay, group-packet leaderboard.

---

## 8. Demo script (win condition — UX is judged)

1. Phone A shows a red-packet QR on screen.
2. Phone B scans → wallet pops → claim → "You received ●●●● (hidden)".
3. Tap reveal → amount shown **only to claimer**.
4. Open Sepolia explorer → tx exists, **no amount visible**.
5. Switch to P2P: scan a friend's receive QR → pay → same privacy.
6. Auditor tab: paste view key → totals reconcile. Public still sees nothing.

~45 seconds. Memorable, concrete, privacy proven live.

---

## 9. Submission checklist (per program rules)

- [ ] Smart contracts deployed on Sepolia (addresses documented).
- [ ] Frontend (mobile-first PWA) live + repo.
- [ ] Clear README / docs (setup, architecture, how privacy works).
- [ ] 3-minute video pitch (demo script above).
- [ ] Uses TokenOps SDK for confidential disperse (red packet funding).
- [ ] Selective-disclosure / audit feature documented.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Claim front-running | Bind reveal to `msg.sender` (commit-reveal) or encrypted-input secret. Decide Week 1. |
| FHE gas on batch disperse | Paginate funding in chunks (~20–50 slots/tx). |
| Camera + wallet on mobile flaky | Test on real device in Week 4, not at the end. |
| Re-encryption UX confusing | Budget frontend time; make reveal a single obvious tap. |
| Rolling own crypto | Use audited ERC-7984 + TokenOps SDK only. |
| Random-split fairness on-chain | Use FHE randomness carefully; if risky, ship equal-split as default and mark random as stretch. |

---

## 11. Open decisions

1. Anti-front-run scheme: commit-reveal **or** encrypted-input secret? (Week 1)
2. Red packet default: equal-split first; random as stretch — confirm.
3. Token: use program-provided cUSDT, or deploy own ERC-7984 test token?
4. Builder Track vs Special Bounty submission — or both? (Both is allowed; tailor video.)

---

_Working title: **SealQR**. Next step: scaffold repo (Hardhat + ERC-7984 + TokenOps SDK + Next.js PWA scan stub) and design the claim-secret scheme._
