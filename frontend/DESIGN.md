# SealQR — Design System (Premium Fintech)

Direction: **Revolut / Wise / Apple Wallet** — calm, airy, bank-grade trust. Dark by default
(privacy reads premium). Restraint over decoration. One accent, lots of breathing room,
quiet motion. This is a confidential payments app — it should feel like money is safe here.

## Principles
1. **Calm > flashy.** Flat surfaces + hairline borders beat heavy gradients/glow. Gradient is a
   garnish (primary CTA, balance accent, logo) — never on every card.
2. **Air.** Generous spacing. Group with whitespace, not boxes. Section rhythm: `space-y-6`.
3. **One accent.** Violet `seal` is the single brand accent. `emerald` = received/positive,
   `lucky` (red) = red-packet feature only, `zama` yellow = the FHE badge only. Don't rainbow.
4. **Quiet motion.** Springs are soft (stiffness ~180–260, damping ~26–32). No bounce on
   functional UI. Fades + 8–12px rises. Durations 0.4–0.55s, ease `[0.22,1,0.36,1]`.
5. **Numbers are typography.** Balances/amounts use `tabular-nums tracking-tight`.

## Tokens (Tailwind)
- **Surfaces:** `bg-ink-950` page · `card` = `bg-surface` w/ hairline border. Use `.card`,
  `.card-flat`, `.card-inset` classes — don't hand-roll card styles.
- **Borders:** hairline `border-white/[0.08]`. Hover `border-white/[0.14]`.
- **Text:** `text-white` primary · `text-white/60` secondary · `text-white/40` tertiary ·
  `.label` for uppercase eyebrow labels.
- **Accent:** `seal-500` solid, `seal-400` text-on-dark, `bg-seal-gradient` CTA only.
- **Radii:** cards `rounded-3xl` (24px), inputs/buttons `rounded-2xl`, pills `rounded-full`,
  sheet top `rounded-t-[28px]`.
- **Shadow:** `shadow-card` (resting, subtle), `shadow-lift` (raised/sheet/nav). Avoid `glow`
  except primary CTA + balance.

## Components (use these classes / primitives — already built, do not redefine)
- `.btn` + `.btn-primary` `.btn-ghost` `.btn-dark` `.btn-lucky` `.btn-danger`
- `.card` `.card-flat` `.card-inset` `.card-hover`
- `.pill` `.pill-accent` `.pill-zama` `.label` `.input-base` `.row` `.divider`
- Primitives: `<BalanceCard>`, `<CipherText>`, `<RevealValue>`, `<AmountInput>`, `<QRDisplay>`,
  `<Sheet>`, `<Spinner>`. Layout: `<Header>`, `<BottomNav>`, `<AppShell>`, `<ZamaBadge>`.
- Icons: `lucide-react`, `strokeWidth={1.75}` default (thinner = more premium). `h-5 w-5` inline.
- Motion: `framer-motion`. Reuse the `fade(i)` stagger pattern (delay `i*0.05`).

## Layout rules
- Mobile-first, single column, `max-w-md`. Page padding handled by `AppShell` — screens just
  return `<div className="space-y-6">…`.
- Every screen: a clear title/eyebrow, primary action obvious, secondary muted.
- Empty states: centered icon chip + one line + one muted hint. Never a bare "no data".
- Lists: use `.row` items inside a `.card` with `.divider` between, OR standalone cards w/ gap.

## Do / Don't
- DO align number columns, use `tabular-nums`, keep 1 primary CTA per view.
- DO keep encrypted values behind `<CipherText>` with a lock + reveal affordance.
- DON'T stack gradients, DON'T use >1 glow per screen, DON'T use red/green except their meaning,
  DON'T touch `tailwind.config.ts`, `globals.css`, or shared primitives (owned by foundation).
