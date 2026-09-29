# Simplification pass

Owner feedback on the rebuilt demo sites: *"Simplify, reduce text quantity, revise flows so that context is only given when necessary. Two top bars on homepage is too busy; demo banners only on demo/app pages."*

This pass follows the checklist in the TrustRate pilot (`address-review-system/docs/simplification.md`, §4). Binding rules: `monark-brand-guidelines.md` §2 "The product brand", §8 "Restraint", §10 and §11. Fluidswap is Monark-branded, so the header and footer were also brought to the current standard. The DeFi family conventions are unchanged: the same five test tokens (tETH, tWBTC, tUSDC, tDAI, tLINK), the same reference prices and seeded pools, and the footer row linking Yieldmine, BorrowX and VaultLend.

Both scripts are in `scripts/` and run against `pnpm start -p 3131`:

- `node scripts/wordcount.mjs` counts words per page in English at 1440px. *Visible* is the `innerText` of `<main>`: what a visitor reads without opening anything. *Total* also counts closed disclosures, FAQ answers and popovers. *Chrome* is everything outside `<main>` (header and footer). The app pages run on a fresh demo with the live market paused, connected after the swap-page row, with one 1.5 tETH swap made. The exchange's own bar sits inside `<main>`. Most of the remaining app words are data: token amounts, pool names, prices, trade and history rows, and the hidden native `<select>` options behind the token pickers.
- `node scripts/dictcount.mjs` counts words of UI copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main (incl. collapsed) | Chrome |
|-|-:|-:|-:|
| Home | 538 | 725 | 99 |
| How it works | 679 | 669 | 99 |
| Credits | 103 | 103 | 99 |
| 404 | 33 | 33 | 99 |
| App: swap (no wallet) | 132 | 131 | 102 |
| App: swap quote (1.5 tETH) | 187 | 229 | 104 |
| App: pools | 199 | 302 | 104 |
| App: pool tETH/tUSDC | 225 | 222 | 104 |
| App: pool tLINK/tUSDC (fee vote) | 310 | 307 | 104 |
| App: create pool tLINK/tDAI | 80 | 83 | 104 |
| App: activity | 205 | 208 | 104 |
| **Total** | **2,691** | **3,012** | **1,122** |

Dictionary copy: **EN 3,072 words** (meta 152 · common 171 · home 729 · how 604 · credits 94 · pricing 186 · app 1,123); **FR 3,465 words**.

### Inventory

**Shell**
- Header: a "Fluidswap · by Monark" pairing that stacked on two lines below `lg`, the links pushed to the right, an extra dashed "Demo · simulated data" badge inside the app, no Demo chip, and a mobile menu from `md`.
- Footer legal band: "Demo · simulated data" **and** "Testnet demo · not financial advice · no real funds" on every page. The product line was 22 words. The Monark band had no "built by Monark" line.

**Home** (hero + 6 sections, 2 dividers)
1. Hero: eyebrow "Monark DeFi demos · Swaps", H1 (7 words), sub (30 words), 2 buttons, **the testnet disclaimer under the buttons**, and the live curve card.
2. Outcomes: H2, an intro line and 3 items (20–25 words each).
3. "Same trade, two pools": eyebrow, H2, a 22-word body, and the interactive comparison with a 17-word note under it.
4. "What you can do in the demo": H2, an intro line and 4 linked cards (15–17 words each, plus a CTA line).
5. "Who it's for": eyebrow, H2, a 50-word paragraph, and 3 audiences (13–15 words each).
6. FAQ: 7 questions, 25–40-word answers. Three of them were mechanics: price impact, impact vs slippage, impermanent loss.
7. Closing: H2, a body line and a button.

The outcomes restated the "what you can do" cards, and the FAQ restated `/how-it-works`.

**How it works**: eyebrow, H1, a 30-word intro and a 6-chip table of contents. Each section had a 30–40-word paragraph. The impermanent-loss example was a 40-word paragraph that repeated the table next to it, and the table repeated the deposit in its "If you had held" row. The developer table and the approvals note were always open. The CTA had a body line. There were two dividers.

**App (`/app/...`)**
- One bar under the header (tabs, Balances, Demo controls), plus the extra header badge.
- **The testnet line appeared five times per transaction**: under the swap button, the add, remove and create-pool forms, the fee vote, the faucet sheet, and again in the wallet prompt.
- Every page title had an intro paragraph (swap, pools, activity). The curve panel had an intro line, and the add form had a hint line.
- Permanent help: the "vs holding" explanation under the position, the APR explanation under the pools table, the "why" of the fee vote, and the "End the vote now" hint.
- Long lists: 8 live trades with trader addresses, the full activity history, and a TVL line under each "Where the volume goes" bar.
- An empty "Your recent swaps" panel showed before any swap.
- Demo controls: 12–15-word hints and a reset hint.

## 2. What changed

No feature or flow was removed.

### Shell (brand guidelines §2, §10, §11)
- **Header**: `brand.tsx` has the 28px butterfly mark and "Fluidswap" in Nunito Sans 800 18px on one line, with **no "by Monark"**. Its accessible label is "Fluidswap, by Monark: home". The links sit left, right after the brand. The right side reads **Demo chip → EN/FR → 36px theme toggle → primary action** ("Start swapping", or the connect-wallet control inside the app). Below `lg`, only the brand and the menu button show. The sheet holds the links, the Demo chip, EN/FR, the theme toggle and the action. The components are copied from Splitflow's `src/components/site/` (`brand.tsx`, `demo-chip.tsx`, `nav-links.tsx`, `mobile-menu.tsx`, `theme.tsx`). The old `pairing.tsx` and the app-only `app-demo-badge.tsx` are gone.
- **Demo chip**: `bg-primary/8` in light mode, `bg-primary/15` in dark, `text-primary-ink`.
- **Footer**: the Monark band opens with "Fluidswap is built by Monark" / « Fluidswap est conçu par Monark ». The product line went from 22 to 11 words. The legal band keeps only "Demo · simulated data", with the testnet line removed. The DeFi family row (Yieldmine, BorrowX, VaultLend) stays.
- **Marketing pages** have exactly one top bar, the header.

### Home (hero + 6 sections → hero + 5 sections)
- Hero: removed the eyebrow and the testnet line. The sub went from 30 to 11 words.
- **Merged** "Outcomes" into "What you can do": the heading only, 3 linked cards (swap, provide liquidity, vote on a fee) of 8–11 words each, and an arrow instead of a CTA line. The history card was dropped because Activity is a tab in the app.
- "Same trade, two pools": removed the eyebrow and the note under the comparison. The line went from 22 to 10 words.
- "Built for learning together": removed the eyebrow and the 50-word paragraph. Each audience line is now 8–9 words.
- FAQ: 7 → 4 questions, with 11–15-word answers. The three mechanics questions moved to `/how-it-works`, which already answers them in "Price impact vs slippage" (which now opens with why you receive less than the spot price) and "Impermanent loss, worked through". This is the only FAQ on the site.
- Closing: heading and button, with the body line removed. Removed one of the two dividers.

### How it works
- Removed the eyebrow and the table of contents. The intro went from 30 to 10 words.
- Every section line is now 13–17 words, down from 30–40. Impact vs slippage keeps two points per side. The impermanent-loss line is one sentence, and the table dropped its repeated "Deposited" row. The fee tiers are one line.
- For developers: one 16-word line. The contract-call table and the approvals note sit behind **"Show the contract calls"** (context on demand).
- CTA: heading and button. Removed one of the two dividers.

### App (`/app/...`)
- **Testnet line once per transaction**: only in the wallet prompt, when the action moves value. Removed from the swap panel, the add, remove and create-pool forms, the fee vote and the faucet sheet.
- Removed the intro paragraphs under "Swap", "Pools" and "Activity", and the add form's hint.
- **Context on demand** (`src/components/ui/info-tip.tsx`, a Radix popover behind an info icon that opens on click or tap, so it works on touch):
  - "Your trade on the curve" explains the curve.
  - "vs holding" explains impermanent loss.
  - "Fee APR" (pools table) explains how it's calculated.
  - The fee-vote proposal explains why the vote is happening ("Why this vote?").
- The quote's "What do these lines mean?" disclosure stays, with its three lines shortened.
- Removed the "End the vote now (demo)" hint, since the button says it all. "Your voting weight: 8 % of the pool (enough to decide it)" replaces the longer line.
- Live trades: 5 instead of 8, with the trader's address moved into the time's tooltip.
- Activity: the history shows 5 at a time with "Show more" (the page resets when you change the filter). Removed the TVL line under each volume bar, since TVL is on the pools page.
- "Your recent swaps" appears only once you've made a swap.
- Empty states and errors are one line plus the next action: "No positions yet." + *Add liquidity*, "No activity yet." + *Make a swap*, "No liquidity in this pool yet.", "No pool yet. Your deposit sets its starting price." The slippage revert went from 30 to 19 words, and the sign-in rejection is shorter.
- Demo controls: the description is "Shape the simulation.", the hints are 4–9 words, and the reset hint is gone.
- Messages were already shown once: transactions report inline next to their button, and toasts appear only when that panel disappears (pool created, position closed, demo reset). No change there.

French was rewritten to the same brevity in `src/i18n/dictionaries/fr.ts`, not translated word for word. Unused keys were removed from both languages: `home.eyebrow`, `home.outcomes`, `how.toc`, the gate copy, `addToVote`, `endHint`, `resetHint`, `add.hint`, and the credits "used on" lines.

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 538 | 224 | −58% | 725 | 263 | 99 | 83 |
| How it works | 679 | 368 | −46% | 669 | 417 | 99 | 83 |
| Credits | 103 | 62 | −40% | 103 | 62 | 99 | 83 |
| 404 | 33 | 22 | −33% | 33 | 22 | 99 | 83 |
| App: swap (no wallet) | 132 | 82 | −38% | 131 | 81 | 102 | 83 |
| App: swap quote (1.5 tETH) | 187 | 115 | −39% | 229 | 144 | 104 | 82 |
| App: pools | 199 | 161 | −19% | 302 | 264 | 104 | 85 |
| App: pool tETH/tUSDC | 225 | 151 | −33% | 222 | 148 | 104 | 85 |
| App: pool tLINK/tUSDC (fee vote) | 310 | 196 | −37% | 307 | 193 | 104 | 85 |
| App: create pool tLINK/tDAI | 80 | 63 | −21% | 83 | 66 | 104 | 85 |
| App: activity | 205 | 150 | −27% | 208 | 153 | 104 | 85 |
| **Total** | **2,691** | **1,594** | **−41%** | **3,012** | **1,813** | **1,122** | **922** |

The marketing pages alone (home, how it works, credits, 404) went from 1,353 to 676 visible words (−50%). The pools page moved least because it is mostly a table of pool data.

Dictionary copy: **EN 3,072 → 2,134 words (−31%)**, **FR 3,465 → 2,448 (−29%)**. Per section (EN): meta 152 → 152 · common 171 → 154 · home 729 → 296 · how 604 → 372 · credits 94 → 54 · app 1,123 → 907 · pricing 186 → 186 (an internal, unlinked page, left as is). The app dictionary also holds required microcopy (button states, receipts, errors, labels), so it shrinks less than the pages.

### Screenshots

- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-flow2-quote.png`.
- After: `docs/screenshots/en-1440-light-page-home.png`, `docs/screenshots/en-1440-light-flow2-quote.png`, and every other page and flow step in `docs/screenshots/` (EN 390/1440 light/dark, FR 390/1440 light).

No screenshot file was renamed or removed, so the project image (`project-images/defi-swaps.json`) didn't need re-rendering.
