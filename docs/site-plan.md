# Fluidswap by Monark: site plan

Status: shipped on `develop`. This plan was written before the build and has been updated to describe what shipped (see §12 for implementation decisions). A later simplification pass cut the visible copy by 41% and moved the header and footer to the current standard. `docs/simplification.md` records the counts before and after, and what was cut or moved.

- Product: **Fluidswap**, the swapping and liquidity demo of the Monark DeFi family (the trader's view).
- Authoritative description: https://www.monark.io/en/project/defi-swaps
- Branding: **Monark-branded** (`true`). `lovable-migration/monark-brand-guidelines.md` is binding.
- Stack: Next.js 16 (App Router, `src/`, TypeScript strict), pnpm, Tailwind CSS v4, shadcn/ui on the Monark UI registry, `lucide-react`.

---

## 1. Product brief

**Target user.** Someone who wants to *understand* what happens when they swap tokens on a decentralized exchange, by doing it:

- a student in a blockchain association or university course meeting automated market makers (AMMs) for the first time;
- a developer who will integrate or build a swap and wants to see what the contract does to the pool on every call;
- a Monark ambassador running a DeFi workshop who needs something everyone in the room can click through, safely, on testnet tokens.

Secondary: curious community members who have used a production exchange and never knew why "the price moved" or why they received less than quoted.

**Core job to be done.** *"Before I put real money into a DEX, let me trade and provide liquidity with test tokens and see exactly why I get the price I get: where the price comes from, how big my trade is for the pool, what slippage protects me from, and what a liquidity provider earns and risks."*

**Domain concepts** (each explained in plain words the first time the site uses it):

| Concept | Meaning in Fluidswap |
|-|-|
| Pool | A smart contract holding two tokens (its *reserves*). Anyone can trade against it. |
| Constant product (x · y = k) | The pool's pricing rule: after every trade, reserve x times reserve y must stay the same (plus fees). The price is the ratio of the reserves. |
| Spot price | The price for a tiny trade right now: reserve y / reserve x. |
| Price impact | How much *your own trade* moves the price against you, because it changes the reserves. Bigger trade or thinner pool, bigger impact. |
| Slippage tolerance | The worst price you accept if *other trades* land before yours. It sets a **minimum received**; below that, the swap reverts and nothing is spent but the network fee. |
| Swap fee / fee tier | A share of every trade (0.05 %, 0.30 % or 1.00 % depending on the pool) left in the pool for its liquidity providers. |
| Route | The chain of pools a swap goes through when no single pool has both tokens (e.g. tWBTC → tETH → tUSDC). |
| Liquidity provider (LP) | Someone who deposits both tokens of a pool, at the current ratio, and earns its fees. |
| LP tokens | Receipt tokens minted on deposit and burned on withdrawal; they represent your share of the pool. |
| Impermanent loss | The difference between what your deposit is worth now and what it would be worth if you had just held the two tokens. |
| Fee vote | LPs vote, weighted by their LP tokens, to change a pool's fee tier (documented as the "fee mechanics and governance simulation" milestone). |

**What the Lovable version got wrong or left out.**

- It was a generic dark "crypto" dashboard (slate gradient, frosted glass, blue-to-purple gradient buttons, emoji token logos). Nothing Monark, nothing educational.
- It used real mainnet names (ETH, BTC, USDT, UNI) and prices that don't match the rest of the Monark DeFi family.
- The swap button did nothing (`console.log`), the balances were hard-coded strings ("Balance: 12.4589"), and the "price chart" was random noise. No pending, confirmed or failed state anywhere.
- Price impact was computed against a fake 1,000,000-unit reserve that ignored the actual pools, so the one teaching number on screen was wrong. Minimum received, route and the fee were missing; the slippage setting was a dead button.
- Add and remove liquidity were static forms: "Estimated LP tokens 0.0", a fixed 25 % bar, no LP token minting, no share of pool, no fee earnings, no impermanent loss.
- The history was four hard-coded rows. No analytics, no fee mechanics, no governance, no pool creation, all of which are on the documentation page.
- English only, no disclaimers, nothing persisted, a banner stuck over the content.

## 2. Value proposition

**For students and developers learning DeFi, Fluidswap is a testnet exchange that shows the pool math behind every swap and every deposit, so you understand price impact, slippage and liquidity before any real money is at stake, which production exchanges hide behind a single "you receive" number.**

Supporting benefits, as outcomes:

1. **You know the price before you sign.** Every quote breaks down into spot price, your price impact, the pool fee, the route and the minimum you'll receive.
2. **You see why big trades cost more.** Your trade is drawn on the pool's curve: watch the point slide and the price move, and compare a deep pool with a thin one.
3. **You can weigh what liquidity providers earn against what they risk.** Deposit, watch fees accrue from other traders, and see your position against simply holding, before voting on the pool's fee.

## 3. Hero

- **Headline** (7 words): *Every swap, with the pool math showing.*
  FR: *Chaque échange, avec les calculs du pool à découvert.*
- **Subheadline** (11 words): *A testnet exchange that shows how the pool prices every swap.*
  FR: *Une plateforme d'échange sur testnet qui montre comment le pool fixe le prix de chaque échange.*
- No eyebrow, and no disclaimer in the hero: the testnet line lives only in the wallet prompt (§6).
- **Primary CTA:** "Start swapping" / « Commencer à échanger » → `/{locale}/app`.
- **Secondary CTA:** "How the pool sets the price" / « Comment le pool fixe le prix » → `/{locale}/how-it-works`.
- **Visual:** the **live curve card**, built in code (SVG + React): the tETH/tUSDC pool's x · y = k curve, its current point, and a quote that plays through three trade sizes (0.5, 5 and 40 tETH). For each, the point slides along the curve to the new reserves, the chord between the two points is drawn, and a readout shows *You receive*, *Price impact* (Low / Noticeable / High, with colour and label) and *Minimum received*. It is the product's idea in one picture: the same pool gives a worse price the more you ask of it. Product UI rather than a photo, because the curve *is* what Fluidswap teaches. The mesh butterfly sits large and cropped behind it (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) in `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: the idea in 30 seconds, then into the exchange. | Hero with live curve card · What you can do (three linked cards: swap, provide liquidity, vote on a fee) · "Same trade, two pools" (interactive deep vs thin comparison) · Built for learning together (workshop photo + three audiences) · FAQ (4 questions) · Closing call to action |
| `/{locale}/app` | **Swap.** The heart of the demo. | App bar (tabs Swap · Pools · Activity, wallet balances, demo controls) · Swap panel (`swap-form`: pay / receive, reverse, slippage settings, quote breakdown with a "What do these lines mean?" disclosure, impact acknowledgement) · Curve panel (the pool's curve with your trade on it, an info popover explaining it; hop switcher for multi-hop) · Recent swaps (once you have some) |
| `/{locale}/app/pools` | All pools. | Totals (TVL, 24 h volume, 24 h fees) · Your positions (or empty state) · Pool table (pair, fee tier, TVL, 24 h volume, fee APR with an info popover, price) · "Create a pool" for pairs without one |
| `/{locale}/app/pools/[id]` | One pool: understand it and provide liquidity. | Header (pair, fee tier, contract address, network) · Reserves "tanks" and price · Price chart (7 D / 30 D) · Your position (value, share, fees earned, vs holding with an info popover) with Add / Remove tabs · Fee vote (when a proposal exists; "Why this vote?" popover) · Live trades feed (latest 5) · Pool creation form when the pool doesn't exist yet |
| `/{locale}/app/activity` | Your history and the educational analytics. | Your stats (swaps, volume, fees paid, LP fees earned) · Volume by pool (bars) · History list with filters (all, swaps, liquidity, votes, failed), receipts with hashes, 5 at a time with "Show more" · Empty state |
| `/{locale}/how-it-works` | The mechanics, for students and developers. Justified because the documentation page frames the project as teaching "how market mechanics work in a decentralized setting", and the swap page can only hint at it. It also replaces a separate `/developers` page. | One-line intro · The constant product (interactive curve explorer: trade size and pool depth sliders) · Price impact vs slippage (why you receive less than the spot price; two short columns) · Fees and liquidity providers (LP token diagram, impermanent loss worked example) · Routes · Fee votes · Photo (market scale) with the analogy · For developers (one line; the contract-call table behind "Show the contract calls") · Call to action |
| `/{locale}/credits` | Photo, font and icon credits (required by the asset rules). | Photos · Type and icons · Monark brand assets (no intro) |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | Price card "Free, part of Monark" · Costs (none; testnet) · Workshop instances for partners · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo, links home and to the exchange. | |

**Header** (standard Monark shell, brand guidelines §2 and §10): the product brand (28px butterfly mark + "Fluidswap" in Nunito Sans 800 18px on one line, no "by Monark"; label "Fluidswap, by Monark: home") → home · links left after the brand: *Overview*, *How it works*, *Exchange* (active one in `foreground`) · right: Demo chip (primary at 8% light / 15% dark, `primary-ink` text) → EN/FR switch → 36px theme toggle → primary action *Start swapping*, which becomes the `connect-wallet` component inside `/app`. Below `lg`: brand + menu button only, opening a full-height sheet with the links, the Demo chip, EN/FR, the theme toggle and the action. Marketing pages have exactly one top bar; inside `/app` a single compact app bar sits under the header.

**Footer** (three bands): 11-word product line + links (Overview, How it works, Exchange, Credits) and a "Part of the Monark DeFi demos" row (Yieldmine, BorrowX, VaultLend at their `*.monark.io` addresses) · "Fluidswap is built by Monark" / « Fluidswap est conçu par Monark », Monark logo + tagline, links to the project page on monark.io and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", photo credits link. The testnet disclaimer is not in the footer (§6).

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by flow |
|-|-|-|-|
| Full quote breakdown | Know the price, impact, fee and minimum before signing | Home hero; swap panel | Flow 2 |
| Your trade on the curve | See *why* the price moves with trade size and pool depth | Home hero and "two pools"; swap curve panel; `/how-it-works` explorer | Flow 2 |
| Slippage protection that really reverts | Understand what the tolerance protects you from | Swap settings; failure state; `/how-it-works` | Flow 2 (failed variant) |
| Multi-hop routes | Trade pairs that have no direct pool, and see the extra fees | Swap route diagram | Flow 2 |
| Liquidity positions with LP tokens, fees and impermanent loss | Weigh what providing liquidity earns against what it risks | Home "What you can do"; pool page; `/how-it-works` | Flows 3, 4 |
| LP fee votes | See how the people who carry the risk set the fee | Pool page; home "what you can do" | Flow 5 |
| History and analytics | Review every action, failed ones included, and where volume goes | Activity page | All flows |

## 6. Key flows

Every value-moving action goes through a simulated wallet prompt ("Confirm in your wallet": action summary, network, estimated network fee, the testnet disclaimer, *Confirm* / *Reject*). **That prompt is the only place the testnet disclaimer appears**, once per transaction (brand guidelines §11). Then comes a **pending** state with a transaction hash (1.2–2.4 s; 3–6 s with "slow network"), then **confirmed** or **failed**. Demo controls can force the next transaction to revert, make the market move against the next swap, slow the network, pause the live market, and reset the demo. Rejecting in the prompt always gives the "rejected" failure. Failed transactions are recorded in the history with their reason.

1. **Connect a wallet and get test tokens.** `/app` works without a wallet (quotes, pools, curve), and the action button reads "Connect wallet". *Connect* → prompt "Sign in to Fluidswap" (no fee) → *pending* ("Waiting for signature…") → *connected*: header shows the `connect-wallet` chip (Jazzicon + `0x5c1E…a7D2`), balances appear. *Failed*: "You declined the sign-in. Nothing was shared." with retry. Then *Get test tokens* (faucet) → prompt → *pending* → *confirmed*: balances rise, "Test tokens received" shown inline in the balances sheet.
2. **Swap with a full quote.** Pick pay/receive tokens, type an amount (or *Max*) → quote updates live: you receive, rate, route (direct or via tETH/tUSDC), pool fee, price impact with label (Low < 1 %, Noticeable 1–5 %, High > 5 %), minimum received at the slippage tolerance (0.10 / 0.50 / 1.00 % or custom). The curve panel draws the move. High impact requires ticking "I understand this trade moves the price by X %". Insufficient balance and empty amount disable the button with the reason. *Swap* → prompt → *pending* (the reserve tanks shift, hash shown) → *confirmed*: receipt "Swapped 1.5 tETH for 4,777.21 tUSDC", balances and pool reserves update, the curve point stays at its new place. *Failed* variants: rejected; **slippage exceeded** ("Another trade moved the price by 1.8 %, beyond your 0.50 % tolerance. The swap reverted; only the network fee was spent.") when "market moves" is on; generic revert with *Try again*.
3. **Provide liquidity (or create a pool).** Pools → tETH/tUSDC → *Add* → type one amount, the other fills at the pool ratio → preview: LP tokens minted, your new share of the pool, deposit value → *Add liquidity* → prompt → *pending* → *confirmed*: position card updates (share, value), pool TVL rises. *Create a pool*: for a pair without one (e.g. tLINK/tDAI), choose both amounts, which set the starting price (pre-filled at reference prices, with a warning if you stray from them: arbitrage will correct it at your expense) → you are the first LP with 100 % share. *Failed*: "The deposit reverted. Your tokens are still in your wallet." with retry; insufficient balance blocks the button.
4. **Withdraw liquidity.** Your position → *Remove* → 25 / 50 / 75 / 100 % chips or slider → preview: tokens you get back, fees earned included, LP tokens burned, and the comparison with holding (impermanent loss in % and value) → *Remove* → prompt → *pending* → *confirmed*: balances rise, position shrinks or closes ("Position closed"). *Failed*: as above.
5. **Vote on a pool's fee.** tLINK/tUSDC (a thin 1.00 % pool) has a proposal: "Lower the fee to 0.30 %". The tally shows For 31 %, Against 34 %, quorum 50 % of LP tokens reached, and your 8 % unused: your vote decides. *Vote for* / *Vote against* → prompt → *pending* → *confirmed*: your weight lands on the bar and the tally settles. *End the vote now (demo)* → result stamp "Passed, fee is now 0.30 %" (the pool's fee tier changes and future quotes use it) or "Rejected, fee stays 1.00 %". No LP tokens in the pool → "Only liquidity providers of this pool can vote" with a link to *Add liquidity*. *Failed*: as above; your vote isn't counted.

## 7. Content (EN / FR)

The shipped copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts` (typed; the French file must match the English shape). The tables below match the dictionaries after the simplification pass; the dictionaries contain the full set (demo controls, receipts, errors, how-it-works body, credits).

Copy budgets (brand guidelines §8, "Restraint"): no eyebrows; a heading and at most one short line per section; card text ≤ 20 words; no intro paragraphs above app forms; the "why" goes behind an info popover (`src/components/ui/info-tip.tsx`) or a disclosure.

Voice: open, practical, optimistic without hype; Web3 terms explained on first use; sentence case; buttons start with a verb. French written natively (« pool » and « wallet/portefeuille » kept as French speakers use them).

### Home

| Slot | English | Français |
|-|-|-|
| H1 | Every swap, with the pool math showing. | Chaque échange, avec les calculs du pool à découvert. |
| Sub | A testnet exchange that shows how the pool prices every swap. | Une plateforme d'échange sur testnet qui montre comment le pool fixe le prix de chaque échange. |
| CTAs | Start swapping · How the pool sets the price | Commencer à échanger · Comment le pool fixe le prix |
| Hero card label | Live quote · tETH → tUSDC pool | Cotation en direct · pool tETH → tUSDC |
| "What you can do" H2 | What you can do | Ce que vous pouvez faire |
| Cards | **Swap any pair.** See the full quote, and your trade on the curve. · **Provide liquidity.** Earn a share of the fees, and compare with just holding. · **Vote on a pool's fee.** Your LP tokens can decide the tLINK/tUSDC fee. | **Échanger n'importe quelle paire.** Voyez la cotation complète, et votre échange sur la courbe. · **Apporter de la liquidité.** Touchez une part des frais, et comparez à une simple détention. · **Voter sur les frais d'un pool.** Vos jetons LP peuvent décider des frais de tLINK/tUSDC. |
| Two pools H2 | Same trade, two pools | Même échange, deux pools |
| Two pools line | Slide the amount: the thin pool's price moves much faster. | Faites glisser le montant : le prix du pool mince bouge bien plus vite. |
| Two pools labels | You spend · Deep pool · Thin pool · Price impact · You receive | Vous dépensez · Pool profond · Pool mince · Impact sur le prix · Vous recevez |
| Who H2 | Built for learning together | Pensé pour apprendre ensemble |
| Who audiences | **Students.** Meet automated market makers with nothing to lose. · **Developers.** See what each contract call does to the pool. · **Ambassadors.** Run a workshop where everyone can fail safely. | **Étudiants.** Découvrir les teneurs de marché automatisés, sans rien risquer. · **Développeurs.** Voir l'effet de chaque appel de contrat sur le pool. · **Ambassadeurs.** Animer un atelier où chacun peut se tromper sans risque. |
| FAQ H2 | Questions | Questions |
| Closing | Make your first swap. · Start swapping | Faites votre premier échange. · Commencer à échanger |

**FAQ** (the only FAQ on the site; mechanics questions are answered on `/how-it-works`)

| Question | Answer |
|-|-|
| Is any of this real money? / Est-ce de l'argent réel ? | No. Simulated test tokens in your browser. Nothing is signed. / Non. Des jetons de test simulés, dans votre navigateur. Rien n'est signé. |
| What is an automated market maker? / Qu'est-ce qu'un teneur de marché automatisé ? | A contract that prices every trade from the ratio of its two reserves. / Un contrat qui fixe le prix de chaque échange à partir du rapport de ses deux réserves. |
| Can I use it in a workshop? / Puis-je l'utiliser en atelier ? | Yes. "Reset demo" in the demo controls restores the starting pools and balances. / Oui. « Réinitialiser la démo », dans les contrôles de démo, rétablit les pools et les soldes de départ. |
| How is Fluidswap different from Yieldmine, BorrowX and VaultLend? / En quoi Fluidswap diffère de Yieldmine, BorrowX et VaultLend ? | Fluidswap is the trader's view. The others cover lending, borrowing and protocol risk. / Fluidswap, c'est le point de vue du trader. Les autres couvrent le prêt, l'emprunt et le risque du protocole. |

### How it works

| Slot | English | Français |
|-|-|-|
| H1 | How the pool sets the price | Comment le pool fixe le prix |
| Intro | No order book: two piles of tokens and one rule. | Pas de carnet d'ordres : deux réserves de jetons et une règle. |
| 1 H2 | One rule: x · y = k | Une seule règle : x · y = k |
| 1 line | The price is y ÷ x, and the product x · y must not shrink. Drag the trade size. | Le prix, c'est y ÷ x, et le produit x · y ne doit pas diminuer. Faites varier la taille de l'échange. |
| Explorer labels | Trade size · Pool depth · Deep · Thin · Spot price · Your average price · Price impact | Taille de l'échange · Profondeur du pool · Profond · Mince · Prix au comptant · Votre prix moyen · Impact sur le prix |
| 2 H2 | Price impact vs slippage | Impact sur le prix ou glissement |
| 2 line | Why you receive less than the spot price: the pool fee, your impact, and trades that land first. | Pourquoi vous recevez moins que le prix au comptant : les frais du pool, votre impact et les échanges passés avant. |
| 3 H2 | Fees and liquidity providers | Les frais et les fournisseurs de liquidité |
| 3 line | Fees stay in the pool. LP tokens are your claim on a share of it. | Les frais restent dans le pool. Les jetons LP sont votre droit sur une part de celui-ci. |
| IL example | You deposit 1 tETH + 3,200 tUSDC, then tETH rises 50 %. (+ table: your share, if you had held, impermanent loss) | Vous déposez 1 tETH + 3 200 tUSDC, puis le tETH monte de 50 %. |
| 4 H2 | Routes | Les itinéraires |
| 4 line | No direct pool? The swap goes through up to three pools, and each adds a fee. | Pas de pool direct ? L'échange passe par jusqu'à trois pools, et chacun ajoute des frais. |
| 5 H2 | Fee votes | Les votes sur les frais |
| 5 line | Liquidity providers carry the risk, so they set the fee. Quorum: half the LP tokens. | Les fournisseurs de liquidité portent le risque, alors ils fixent les frais. Quorum : la moitié des jetons LP. |
| Analogy | A market scale, with a twist · Add on one side and the other gives. Each extra unit costs more than the last. | Une balance de marché, avec une nuance · Ajoutez d'un côté et l'autre cède. Chaque unité de plus coûte plus cher que la précédente. |
| Dev H2 | For developers | Pour les développeurs |
| Dev line | Each demo action maps to one contract call, behind typed functions you can swap for wagmi/viem. · *Show the contract calls* (disclosure) | Chaque action de la démo correspond à un appel de contrat, derrière des fonctions typées remplaçables par wagmi/viem. · *Voir les appels de contrat* |
| CTA | Try it on the curve · Start swapping | Essayez sur la courbe · Commencer à échanger |

### App: key strings

| Slot | English | Français |
|-|-|-|
| Tabs | Swap · Pools · Activity | Échanger · Pools · Activité |
| Swap fields | You pay · You receive · Max · Balance {amount} | Vous payez · Vous recevez · Max · Solde {amount} |
| Quote rows | Rate · Route · Pool fee · Price impact · Minimum received · Network fee | Taux · Itinéraire · Frais du pool · Impact sur le prix · Minimum reçu · Frais de réseau |
| Impact labels | Low · Noticeable · High | Faible · Notable · Élevé |
| Impact acknowledge | I understand this trade moves the price by {pct}. | Je comprends que cet échange déplace le prix de {pct}. |
| Button states | Connect wallet · Enter an amount · Not enough {symbol} · Choose two different tokens · No route for this pair · Swap · Swapping… | Connecter le portefeuille · Saisissez un montant · Pas assez de {symbol} · Choisissez deux jetons différents · Aucun itinéraire pour cette paire · Échanger · Échange en cours… |
| Slippage | Slippage tolerance · Custom · The swap reverts if the price moves more than this. | Tolérance de glissement · Personnalisée · L'échange est annulé si le prix bouge davantage. |
| Curve panel | Your trade on the curve · Now · After your swap · Reserves | Votre échange sur la courbe · Maintenant · Après votre échange · Réserves |
| Pending / confirmed | Waiting for the network… · Swapped {in} for {out} | En attente du réseau… · {in} échangés contre {out} |
| Failed: slippage | Another trade moved the price by {move}, beyond your {tolerance} tolerance. The swap reverted; only the network fee was spent. | Un autre échange a déplacé le prix de {move}, au-delà de votre tolérance de {tolerance}. L'échange a été annulé ; seuls les frais de réseau ont été dépensés. |
| Failed: rejected | You rejected the request in your wallet. Nothing was sent. | Vous avez refusé la demande dans votre portefeuille. Rien n'a été envoyé. |
| Failed: reverted | The transaction failed on the network. Your tokens didn't move. | La transaction a échoué sur le réseau. Vos jetons n'ont pas bougé. |
| Pools | Total value locked · 24 h volume · 24 h fees · Fee APR · Your positions · Create a pool | Valeur totale bloquée · Volume 24 h · Frais 24 h · APR des frais · Vos positions · Créer un pool |
| Empty: positions | No positions yet. · Add liquidity | Aucune position pour l'instant. · Ajouter de la liquidité |
| Position | Your share · Value · Fees earned · vs holding · Add · Remove · LP tokens | Votre part · Valeur · Frais gagnés · par rapport à la détention · Ajouter · Retirer · Jetons LP |
| Create pool | No pool yet. Your deposit sets its starting price. · {pct} off the reference price. Arbitrage will close the gap at your expense. | Pas encore de pool. Votre dépôt fixe son prix de départ. · {pct} d'écart avec le prix de référence. L'arbitrage comblera l'écart, à vos dépens. |
| Vote | Proposal · Lower the fee to {fee} · For · Against · Quorum · Your voting weight · Vote for · Vote against · End the vote now (demo) · Passed, fee is now {fee} · Rejected, fee stays {fee} · Only liquidity providers of this pool can vote. | Proposition · Baisser les frais à {fee} · Pour · Contre · Quorum · Votre poids de vote · Voter pour · Voter contre · Clore le vote maintenant (démo) · Adoptée, les frais passent à {fee} · Rejetée, les frais restent à {fee} · Seuls les fournisseurs de liquidité de ce pool peuvent voter. |
| Activity | Your history · All · Swaps · Liquidity · Votes · Failed | Votre historique · Tout · Échanges · Liquidité · Votes · Échecs |
| Empty: activity | No activity yet. · Make a swap | Aucune activité pour l'instant. · Faire un échange |
| Demo controls | Demo controls · Shape the simulation. · Slow network · Fail the next transaction · Market moves during the next swap · Live market · Reset demo (hints of 4–9 words) | Contrôles de démo · Modelez la simulation. · Réseau lent · Faire échouer la prochaine transaction · Le marché bouge pendant le prochain échange · Marché en direct · Réinitialiser la démo |
| Disclaimer (wallet prompt only) | Testnet demo · not financial advice · no real funds | Démo sur testnet · pas un conseil financier · aucun fonds réel |
| Storage error | Your browser isn't saving the demo, so it will restart when you reload. | Votre navigateur n'enregistre pas la démo : elle repartira de zéro au rechargement. |
| 404 | This page slipped out of the pool. · The link may be old or mistyped. · Back to home · Open the exchange | Cette page a glissé hors du pool. · Le lien est peut-être ancien ou mal saisi. · Retour à l'accueil · Ouvrir la plateforme |

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by the guidelines: cream / espresso tokens derived from `#f88d10` with `--surface-tint: 1` (§3 token block pasted over the `theme.json` base), Nunito Sans 400/600/700/800, pill actions, 1rem cards, borders not shadows, flat orange only, `primary-ink` for orange text on cream.

- **Layout and rhythm.** Home: asymmetric hero (copy left, curve card right on desktop; stacked on mobile) → three linked cards in a row → "same trade, two pools" as one wide interactive band → photo + audiences → FAQ (single 68ch column, native `<details>`) → closing band. Section divider used once. The app is a trading tool: on desktop the swap panel (fixed ~440px) sits beside the curve panel; on mobile they stack with the swap panel first and the curve collapsible under the quote. Pool page: two columns (pool facts + chart left, position and vote right), stacked on mobile. Monospace only for addresses and hashes; amounts use tabular figures.
- **Hero visual.** The live curve card (§3).
- **Mesh butterfly.** Used once, on the home hero: large, cropped off the top-right edge, at low opacity behind the curve card. Flat lines, no glow. Nowhere else.
- **Illustrations.** No other Monark decorative files. Fluidswap draws its own flat orange line art: the x · y = k curve (hero, swap page, how-it-works explorer), reserve "tanks" (pool page, swap pending), route diagram (swap page, how-it-works), LP token diagram (how-it-works). Token marks are simple lettered discs in muted, distinct colours (not real logos, never glowing coins).
- **Photography direction.** Warm, natural, unstaged: students at shared desks in a workshop, and a market scale as the analogy for a pool. Same warm grade; used once each, always next to copy that carries the point.
- **Signature moments.**
  1. **The sliding point.** As you type an amount, the point slides along the curve and the chord between "now" and "after" is drawn; the impact label changes colour and word at 1 % and 5 %.
  2. **The shifting tanks.** While a swap is pending, the two reserve bars of the pool rebalance (one fills, one drains) and settle when the block confirms; a slippage revert snaps them back.
  3. **The settling tally.** Your LP-weighted vote lands on the For/Against bar, the bar reflows, and "End the vote" stamps the result and changes the pool's fee tier live.
- All state motion 150–250 ms ease-out (the hero loop and the point slide are slower, explanatory); `prefers-reduced-motion` shows final states.

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/workshop.jpg` (Unsplash, Raka Rahmadani, "Students working on laptops at a shared desk") | People learning together: who Fluidswap is for | Home "Built for learning together" |
| `public/images/scale.jpg` (Unsplash, mathieu gauzy, "Tomatoes and green peppers at a market scale") | The balance analogy for x · y = k | `/how-it-works` analogy block |
| `public/brand/*` Monark logos (standalone, horizontal light/dark, vertical light/dark) | Header pairing, footer, 404, favicon, wallet prompt | Shell |
| `public/brand/monark-mesh.svg` | Home hero decoration | Home hero only |
| `public/brand/socials/*.svg` | Footer social icons | Footer |
| Open Graph image | Generated with `next/og` per locale (pairing + headline + a drawn curve) | Metadata |

Icons: Lucide only. Diagrams and charts: SVG/JSX in code (curve, tanks, route, LP diagram, price chart, volume bars). Full credits in `docs/assets.md` and on `/credits`.

## 10. Pricing strategy

Fluidswap is **free, included in the Monark bundle**, and the plan confirms the default. It is a testnet teaching tool: its swap fees are part of the lesson and paid in worthless test tokens, so there is nothing to charge on; charging students would work against Monark's education mission; and the family (Yieldmine, BorrowX, VaultLend) is meant to be used side by side in the same workshop. The one thing partners may want, a hosted **workshop instance** with custom pools, tokens and a class reset, is offered free through Monark's partnership programme rather than a price list. If Fluidswap ever moved to mainnet with real funds, it would need a separate brand and a real fee model (see `repos-and-websites.md`); that is out of scope here.

A designed `/{locale}/pricing` page exists **for internal review only**: not linked anywhere, excluded from `sitemap.xml`, `robots: { index: false, follow: false }`. No other page mentions prices.

## 11. Out of scope

- Real wallets, chains, signing or tokens (no wagmi/viem; the data layer in `src/lib/demo/` is shaped so it could be swapped in). No mainnet token names.
- Token approvals (the ERC-20 `approve` step before a swap or deposit): mentioned on `/how-it-works`, skipped in the flows to keep them focused.
- Concentrated liquidity (price ranges), limit orders, gas settings, MEV protection, permit signatures.
- Price oracles and real market data: prices move only through trades in the simulation (yours, the live market's, and the "market moves" control).
- Lending, borrowing and risk dashboards: those belong to Yieldmine, BorrowX and VaultLend.
- A `/brand` page, a blog, accounts or any backend.

## 12. Implementation notes (as shipped)

Decisions made while building unattended:

- **Theme.** The brief says not to install `theme-2026.json`, so I installed `theme.json` from ui.monark.io and pasted the guidelines' §3 token block over it in `src/app/globals.css`. I also added muted `--success` and `--warning` colours for the health and impact states, which always appear with a text label.
- **Registry components.** The `@monark` registry is registered in `components.json`. `button`, `input`, `select`, `tabs`, `dialog`, `sheet`, `slider`, `switch`, `checkbox`, `tooltip`, `dropdown-menu`, `sonner`, `wallet`, `token-amount`, `network-badge` and `tx-status` came from the CLI. `connect-wallet` and `swap-form` don't resolve through the CLI (their bare `wallet` dependency points at the shadcn default registry), so I copied their source from the registry JSON.
  - `swap-form` gained localizable labels, balance hints, a Max action, a settings-panel slot and slots for quote details and the footer.
  - `wallet`, `dialog`, `sheet` and `slider` gained localizable accessible labels.
  - Every component was restyled to Monark pills and rounded fields.
- **Maths.** Amounts are JS numbers in token units rather than bigint base units. Double precision is enough for a teaching demo, and `toBaseUnits()` converts them for the registry `token-amount`. Routing tries every simple path of up to 3 pools and picks the best output. Price impact is shown excluding fees, and the fees are shown separately.
- **Impermanent loss** is valued at the pool's own price, the classic view. The shared reference prices are constant across the DeFi family, so valuing at those prices would hide it.
- **Fee vote.** The tally is in LP tokens: 31 % for and 34 % against, with the visitor's 8 % deciding. The quorum is 50 % of the LP supply. "End the vote now (demo)" executes the result, and a passed vote changes the pool's fee for future quotes.
- **Toasts.** Every transaction reports inline, next to the button that started it, as signing → pending (with hash) → confirmed or failed, with the reason and a retry. Toasts appear only when the panel that would report a result disappears: pool created, position closed, demo reset. They sit bottom-left, away from the right-hand panels and sheets. An early version showed top-right toasts on every action, and those covered the balances button and the position card, so I dropped them.
- **Live market.** Other traders swap every 6–11 s while the exchange tab is visible, mostly as arbitrage back toward the reference prices. Their trades accrue LP fees to positions. It can be paused in the demo controls, and the screenshot script pauses it so captures are stable.
- **Routes.** Every one of the 10 pairs is prerendered under `/app/pools/[id]` (`dynamicParams = false`). A pair with no pool renders the "create a pool" form.
- **Dependencies beyond the stack.**
  - `next-themes` provides the theme toggle without a flash of the wrong theme.
  - `sonner` provides the toasts.
  - `react-jazzicon` is required by the registry `wallet` component.
  - The Radix primitives come with the registry components.
  - `playwright` is a dev dependency, used for `pnpm screenshots`.
  - I didn't use recharts: the charts are small and drawn in SVG.
- **Photos.** I used two photos instead of three, one per page. The product UI carries the rest.
- **Screenshots** are in `docs/screenshots/`: every page and flow at 390 and 1440 px, in light and dark, in English, plus the home page, the swap flow and a pool page in French. Two captures from before the simplification pass are kept in `docs/screenshots/before/`.
- **Simplification pass** (see `docs/simplification.md`):
  - The shell uses the standard header (`brand.tsx`, `demo-chip.tsx`, `nav-links.tsx`, `mobile-menu.tsx`, `theme.tsx`, copied from Splitflow) and the footer's "built by Monark" line.
  - The testnet disclaimer appears only in the wallet prompt.
  - `src/components/ui/info-tip.tsx` (Radix popover, which adds `@radix-ui/react-popover`) holds the in-app "why" explanations: the curve, vs holding, fee APR and the fee vote.
  - Lists are shorter: 5 live trades, and the activity history 5 at a time.
  - `scripts/wordcount.mjs` and `scripts/dictcount.mjs` measure the copy.
