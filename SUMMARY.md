# SealQR — Session Summary

_Last updated: 2026-05-30 (Reveal-bug fix + WalletConnect + UX polish pass)_

Confidential payments-by-QR + confidential red packets (红包) on Zama FHEVM / ERC-7984. Built from `plan/PLAN.md` for the Zama Developer Program (Special Bounty × TokenOps, UX-scored). Deadline **2026-07-07**.

---

## 🔧 Reveal bug + WalletConnect + UX polish (2026-05-30, latest)

`pnpm build` green (9/9 routes). All pages serve 200 on dev. Net new file: `components/wallet/WalletSheet.tsx`.

### Bug fixes (the reported "reveal balance does nothing")
- **Root cause:** `lib/seal.tsx revealBalance()` had **no try/catch** and `BalanceCard` fired it unawaited — any failure (WASM load, EIP-712 sign rejection, relayer) died silently, so the spinner just stopped and nothing revealed ("never transitions to wallet"). Now wrapped: surfaces `toast.error` (distinguishes "Signature cancelled" from real failures). Same fix applied to `app/audit/page.tsx` reveal.
- **`lib/fhevm.ts`:** relayer `network` was `window.ethereum` → broke on wrong chain / mobile / WalletConnect (no injected provider). Now uses the configured **Sepolia RPC** (`NEXT_PUBLIC_SEPOLIA_RPC_URL`) — chain-agnostic ACL/KMS reads, works for any wallet.

### WalletConnect
- `lib/wagmi.ts` — added `walletConnect` connector (gated on `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`; injected always on). New env var in `.env.local`/`.env.example`. **User supplied a live project id** → WalletConnect active.
- New `components/wallet/WalletSheet.tsx` — global connect picker (Injected vs WalletConnect QR), mounted in `AppShell`. `lib/seal.tsx` now exposes `connectors`/`connectWith`/`connecting`/`pickerOpen`; `connect()` opens the picker (or direct-connects when only one connector). Every "Connect wallet" CTA app-wide now gets the picker for free.
- Benign build noise: WalletConnect logs `indexedDB is not defined` + a chunk circular-dep warning during SSG — non-fatal, pages prerender fine.

### UX/UI polish (from a 6-dimension multi-agent audit, 47/50 findings verified; high-value subset applied)
- **Consistency:** legacy `iris-*` → `seal-*` everywhere (single violet accent); border radii unified (`rounded-3xl` on nav/sheet/QR); trimmed glow overuse (header logo, packet list rows, QR) — glow now reserved for true CTAs + nav center.
- **A11y:** `aria-label` + ≥40px tap targets on all icon-only close/refresh buttons; `.label` contrast `white/40→/55`; surfaces slightly more opaque for legibility; descriptive QR `alt`; **`prefers-reduced-motion`** media query added.
- **Mobile:** QR responsive (`h-44 sm:h-56`, no 320px overflow); balance amount responsive (`2.25rem sm:2.75rem`); header badge/connect pill shrink on small screens; nav center `z-40`; sheet drag threshold 120→140px.
- **Flows:** ClaimSheet "Open packet" now `disabled` during claim (no double-claim); clipboard copy/share + connect now have error toasts; QRScanner gained a **"Try camera again"** recovery + clearer error copy.
- **Delight:** tactile `whileTap` on quick-action tiles + nav center; punchier confetti + **haptic** (`navigator.vibrate`) on packet open; stronger revealed-state ring on the balance eye toggle.
- **Copy:** assertive privacy/empty-state strings; "Packet sealed · Share the link"; less-jargon audit disclosure; consistent "Request" terminology.

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

## 🎨 Premium Fintech Redesign (2026-05-30)

Full visual overhaul → **Revolut / Wise / Apple Wallet** direction (user-chosen): calm, airy, bank-grade. Built foundation-first (singular hand), then 4 parallel agents reskinned screens on frozen primitives. `pnpm build` green (9/9 routes). Net **+804 / −416** over 20 files.

### Foundation (`DESIGN.md` spec drives all)
- **Palette calmed:** deep cool near-black `ink-*` (`#070810`…), single violet `seal` accent, new **`emerald`** = positive/received, semantic **`surface`** (`DEFAULT`/`raised`/`inset`). Cyan/iris kept legacy.
- **Shadows softened:** `shadow-card` (resting) + `shadow-lift` (raised) replace heavy `shadow-float`/multi-glow. `glow` reserved for primary CTA + balance only. Removed `shadow-float`, `shadow-glow-cipher`, `bg-grid-fade`.
- **Page bg:** one subtle violet bloom (was 3 stacked radials). Icons thinner (`--icon-stroke: 1.75`). Motion calmer (springs ~180–260 stiffness, ease `[0.22,1,0.36,1]`, no bounce).
- **Globals:** new `.card`/`.card-flat`/`.card-inset`, `.row`/`.divider` list pattern, `.pill-accent`, `.tnum` (tabular-nums). `.pill-meta`→alias of `.pill-accent`.

### Primitives reskinned (foundation-owned, frozen for agents)
- `BalanceCard` (single bloom, tnum, "Add test cUSD"), `AmountInput` (active quick-chip state, tnum), `QRDisplay` (clean white card, no garish ring), `Sheet` (calm spring, `rounded-t-[28px]`, `surface-raised`), `BottomNav`, `ConnectButton` (emerald status dot), `Toaster`.

### Screens reskinned (4 agents, disjoint files)
- **Home** — premium quick-action tiles, trust-styled privacy block, `.row`/`.divider` activity (emerald=received), strong empty state.
- **Pay** — calm Receive hero, bank-style confirm sheet (emerald check), tnum history.
- **Packet** — premium-festive lucky-red/gold (the one place red leads), buttery open/confetti reveal, trustworthy 2-step auditor grant w/ full monospace addr.
- **Scan + Audit** — native-feel scanner (corner guides + soft scan line), compliance-style disclosure list w/ emerald reveals.

### Build fixes
- `text-white/12` → `text-white/[0.12]` (non-default opacity step broke CSS build).
- Stale `shadow-float` in `Toaster.tsx` → `shadow-lift`.

---

## 🎨 UI/UX Pass (2026-05-29)

### Theme — Zama-adjacent, distinct identity
- **Primary** shifted teal → **electric violet** (`seal-*`: 400 `#8466FF`, 500 `#6E4CFF`, 600 `#5B36F0`). Signals "sealed/encrypted"; distinct from Zama yellow.
- **Secondary cyan** added (`cipher-*`: 400 `#4FD1C5`, 500 `#27B6A8`) — ciphertext / data-flow accent.
- **Zama yellow** added as RARE accent only (`zama-*`: 400 `#FFE04D`, 500 `#FFD208`). Used solely for the "Encrypted by Zama FHEVM" footer badge — never primary CTAs.
- Refined `ink-*` deep neutrals, new gradients (`bg-seal-gradient` violet→cyan, `bg-cipher-gradient`), new shadows (`shadow-glow`, `shadow-glow-cipher`, `shadow-glow-zama`).
- Globals: new `.pill-tag`, `.pill-meta`, `.pill-zama`, `.btn-danger`, `.pixel-divider` (subtle Zama nod). Focus-visible outlines for a11y. Smoother `animate-spin-smooth` keyframe.

### Bugs fixed (10)
- `components/ui/Spinner.tsx` — `animate-spin` undefined → `animate-spin-smooth`
- `components/layout/BottomNav.tsx` — z-index 40→30 (sheets sit on top); non-center labels hide at `<340px`
- `components/ui/Sheet.tsx` — drag-down now scales (`1 - y/2000`) + fades (`1 - y/600`) via `useMotionValue`/`useTransform`
- `components/AmountInput.tsx` — `py-7`→`py-5`, `ring-4`→`ring-2`, wrap `overflow-hidden`
- `components/flows/PayConfirmSheet.tsx` — `useEffect` resets `done`+`amount` on `payload` change
- `components/BalanceCard.tsx` — `aria-label`, `aria-pressed`, `disabled={revealing}`, violet `ring-1 ring-seal-500/30` when revealed
- `components/QRScanner.tsx` — inline **Clear** button on manual-paste error
- `components/flows/ClaimSheet.tsx` — confetti `delay: i * 0.07` stagger, envelope shake `ease: "easeInOut"`
- `components/CipherText.tsx` callers — standardized to 5 dots (6 for big balance)
- `app/packet/page.tsx` GrantSheet — two-step `step: "input" | "confirm"`; confirm view shows full monospace address before `grantAuditor` call

### New
- `components/layout/ZamaBadge.tsx` — "Encrypted by Zama FHEVM" pill + pixel divider + ERC-7984 subtitle. Mounted at bottom of every page in `AppShell`.

---

## 🐙 GitHub + Vercel link (2026-05-29)
- **Repo:** https://github.com/joymadhu49/sealqr (public, root commit `1d57a5b`)
- `vercel git connect` — Vercel project `joys-projects-99b5b538/frontend` now auto-deploys on push to `main`
- Prod re-deployed: https://frontend-beryl-eta-53.vercel.app
- `.gitignore` extended (`.next/`, `.vercel/`, `artifacts/`, `cache/`, `deployments/`, etc.)

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
- [ ] (Optional) Add GitHub README badges (Vercel deploy status, Sepolia chainId, license)
- [ ] (Optional) Manual QA on real phone: bottom-sheet drag feedback, QR scan, packet open animation

## ⚠️ Build gotchas (so they aren't re-hit)
- Inherit `ZamaEthereumConfig` (chain-aware), not a `SepoliaConfig` contract — not exported by `@fhevm/solidity` 0.11.
- `FHE.allowTransient(handle, address(token))` before handing an euint to the token, or `ACLNotAllowed()`.
- `@fhevm/hardhat-plugin` 0.4.2 pins `@zama-fhe/relayer-sdk` to exactly `0.4.1`.
- Next.js: import core actions from `wagmi/actions`; alias `pino-pretty` + `@react-native-async-storage/async-storage` to `false`; relayer SDK is browser-only (`@zama-fhe/relayer-sdk/web`, `initSDK()` before `createInstance`).
