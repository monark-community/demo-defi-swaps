# Fluidswap by Monark: site plan

Status: shipped on `develop`. This plan was written before the build and has been updated to describe what shipped (see §12 for implementation decisions).

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
- **Subheadline:** *Fluidswap is a testnet exchange for learning how automated market makers really work. Swap, provide liquidity and watch price impact, slippage and fees play out on the pool's curve.*
  FR: *Fluidswap est une plateforme d'échange sur testnet pour comprendre comment fonctionnent vraiment les teneurs de marché automatisés. Échangez, apportez de la liquidité et voyez l'impact sur le prix, le glissement et les frais se jouer sur la courbe du pool.*
- **Primary CTA:** "Start swapping" / « Commencer à échanger » → `/{locale}/app`.
- **Secondary CTA:** "How the pool sets the price" / « Comment le pool fixe le prix » → `/{locale}/how-it-works`.
- **Visual:** the **live curve card**, built in code (SVG + React): the tETH/tUSDC pool's x · y = k curve, its current point, and a quote that plays through three trade sizes (0.5, 5 and 40 tETH). For each, the point slides along the curve to the new reserves, the chord between the two points is drawn, and a readout shows *You receive*, *Price impact* (Low / Noticeable / High, with colour and label) and *Minimum received*. It is the product's idea in one picture: the same pool gives a worse price the more you ask of it. Product UI rather than a photo, because the curve *is* what Fluidswap teaches. The mesh butterfly sits large and cropped behind it (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) in `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: the idea in 30 seconds, then into the exchange. | Hero with live curve card · Three outcomes · "Same trade, two pools" (interactive deep vs thin comparison) · What you can do in the demo (four deep links: swap, provide liquidity, vote on fees, read your history) · Who it's for (workshop photo + three audiences) · FAQ · Closing call to action |
| `/{locale}/app` | **Swap.** The heart of the demo. | App bar (tabs Swap · Pools · Activity, wallet balances, demo controls) · Swap panel (`swap-form`: pay / receive, reverse, slippage settings, quote breakdown, impact acknowledgement, disclaimer) · Curve panel (the pool's curve with your trade on it; route diagram for multi-hop) · Recent swaps |
| `/{locale}/app/pools` | All pools. | Totals (TVL, 24 h volume, 24 h fees) · Your positions (or empty state) · Pool table (pair, fee tier, TVL, 24 h volume, fee APR, price) · "Create a pool" for pairs without one |
| `/{locale}/app/pools/[id]` | One pool: understand it and provide liquidity. | Header (pair, fee tier, contract address, network) · Reserves "tanks" and price · Price chart (7 D / 30 D) · Your position (value, share, fees earned, vs holding) with Add / Remove tabs · Fee vote (when a proposal exists) · Live trades feed · Pool creation form when the pool doesn't exist yet |
| `/{locale}/app/activity` | Your history and the educational analytics. | Your stats (swaps, volume, fees paid, LP fees earned) · Volume by pool (bars) · History list with filters (all, swaps, liquidity, votes, failed) and receipts with hashes · Empty state |
| `/{locale}/how-it-works` | The mechanics, for students and developers. Justified because the documentation page frames the project as teaching "how market mechanics work in a decentralized setting", and the swap page can only hint at it. It also replaces a separate `/developers` page. | Intro · The constant product (interactive curve explorer: trade size and pool depth sliders) · Price impact vs slippage (two-column explainer) · Fees and liquidity providers (LP token diagram, impermanent loss worked example) · Routes · Fee votes · For developers (the contract calls each action maps to, and the typed data layer that mirrors them) · Photo (market scale) with the analogy · Call to action |
| `/{locale}/credits` | Photo, font and icon credits (required by the asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | Price card "Free, part of Monark" · Costs (none; testnet) · Workshop instances for partners · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo, links home and to the exchange. | |

**Header** (standard Monark shell): "Fluidswap by Monark" pairing → home · links: *Overview*, *How it works*, *Exchange* (pill highlight on the active one) · EN/FR switch · theme toggle · primary pill *Start swapping*. Inside `/app` the primary action becomes the `connect-wallet` component and a "Demo · simulated data" badge appears. Mobile: pairing + menu button opening a full-height sheet.

**Footer** (three bands): product line + links (Overview, How it works, Exchange, Credits) and a "Part of the Monark DeFi demos" row (Yieldmine, BorrowX, VaultLend at their `*.monark.io` addresses) · Monark logo + tagline, links to the project page on monark.io and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", the testnet disclaimer, photo credits link.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by flow |
|-|-|-|-|
| Full quote breakdown | Know the price, impact, fee and minimum before signing | Home hero; swap panel | Flow 2 |
| Your trade on the curve | See *why* the price moves with trade size and pool depth | Home hero and "two pools"; swap curve panel; `/how-it-works` explorer | Flow 2 |
| Slippage protection that really reverts | Understand what the tolerance protects you from | Swap settings; failure state; `/how-it-works` | Flow 2 (failed variant) |
| Multi-hop routes | Trade pairs that have no direct pool, and see the extra fees | Swap route diagram | Flow 2 |
| Liquidity positions with LP tokens, fees and impermanent loss | Weigh what providing liquidity earns against what it risks | Home outcomes; pool page; `/how-it-works` | Flows 3, 4 |
| LP fee votes | See how the people who carry the risk set the fee | Pool page; home "what you can do" | Flow 5 |
| History and analytics | Review every action, failed ones included, and where volume goes | Activity page | All flows |

## 6. Key flows

Every value-moving action goes through a simulated wallet prompt ("Confirm in your wallet": action summary, network, estimated network fee, the testnet disclaimer, *Confirm* / *Reject*), then a **pending** state with a transaction hash (1.2–2.4 s; 3–6 s with "slow network"), then **confirmed** or **failed**. Demo controls can force the next transaction to revert, make the market move against the next swap, slow the network, pause the live market, and reset the demo. Rejecting in the prompt always gives the "rejected" failure. Failed transactions are recorded in the history with their reason.

1. **Connect a wallet and get test tokens.** `/app` works without a wallet (quotes, pools, curve), and the action button reads "Connect wallet". *Connect* → prompt "Sign in to Fluidswap" (no fee) → *pending* ("Waiting for signature…") → *connected*: header shows the `connect-wallet` chip (Jazzicon + `0x5c1E…a7D2`), balances appear. *Failed*: "You declined the sign-in request. Nothing was shared." with retry. Then *Get test tokens* (faucet) → prompt → *pending* → *confirmed*: balances rise, "Test tokens received" shown inline in the balances sheet.
2. **Swap with a full quote.** Pick pay/receive tokens, type an amount (or *Max*) → quote updates live: you receive, rate, route (direct or via tETH/tUSDC), pool fee, price impact with label (Low < 1 %, Noticeable 1–5 %, High > 5 %), minimum received at the slippage tolerance (0.10 / 0.50 / 1.00 % or custom). The curve panel draws the move. High impact requires ticking "I understand this trade moves the price by X %". Insufficient balance and empty amount disable the button with the reason. *Swap* → prompt → *pending* (the reserve tanks shift, hash shown) → *confirmed*: receipt "Swapped 1.5 tETH for 4,777.21 tUSDC", balances and pool reserves update, the curve point stays at its new place. *Failed* variants: rejected; **slippage exceeded** ("Another trade moved the price by 1.8 % before yours landed. That's beyond your 0.50 % tolerance, so the swap reverted. Only the network fee was spent.") when "market moves" is on; generic revert with *Try again*.
3. **Provide liquidity (or create a pool).** Pools → tETH/tUSDC → *Add* → type one amount, the other fills at the pool ratio → preview: LP tokens minted, your new share of the pool, deposit value → *Add liquidity* → prompt → *pending* → *confirmed*: position card updates (share, value), pool TVL rises. *Create a pool*: for a pair without one (e.g. tLINK/tDAI), choose both amounts, which set the starting price (pre-filled at reference prices, with a warning if you stray from them: arbitrage will correct it at your expense) → you are the first LP with 100 % share. *Failed*: "The deposit reverted. Your tokens are still in your wallet." with retry; insufficient balance blocks the button.
4. **Withdraw liquidity.** Your position → *Remove* → 25 / 50 / 75 / 100 % chips or slider → preview: tokens you get back, fees earned included, LP tokens burned, and the comparison with holding (impermanent loss in % and value) → *Remove* → prompt → *pending* → *confirmed*: balances rise, position shrinks or closes ("Position closed"). *Failed*: as above.
5. **Vote on a pool's fee.** tLINK/tUSDC (a thin 1.00 % pool) has a proposal: "Lower the fee to 0.30 %". The tally shows For 31 %, Against 34 %, quorum 50 % of LP tokens reached, and your 8 % unused: your vote decides. *Vote for* / *Vote against* → prompt → *pending* → *confirmed*: your weight lands on the bar and the tally settles. *End the vote now (demo)* → result stamp "Passed, fee is now 0.30 %" (the pool's fee tier changes and future quotes use it) or "Rejected, fee stays 1.00 %". No LP tokens in the pool → "Only liquidity providers of this pool can vote" with a link to *Add liquidity*. *Failed*: as above; your vote isn't counted.

## 7. Content (EN / FR)

The shipped copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts` (typed; the French file must match the English shape). Below is the draft for every section; the dictionaries contain the full set (form hints, demo controls, receipts, toasts, how-it-works body, credits).

Voice: open, practical, optimistic without hype; Web3 terms explained on first use; sentence case; buttons start with a verb. French written natively (« pool » and « wallet/portefeuille » kept as French speakers use them).

### Home

| Slot | English | Français |
|-|-|-|
| Eyebrow | Monark DeFi demos · Swaps | Démos DeFi Monark · Échanges |
| H1 | Every swap, with the pool math showing. | Chaque échange, avec les calculs du pool à découvert. |
| Sub | Fluidswap is a testnet exchange for learning how automated market makers really work. Swap, provide liquidity and watch price impact, slippage and fees play out on the pool's curve. | Fluidswap est une plateforme d'échange sur testnet pour comprendre comment fonctionnent vraiment les teneurs de marché automatisés. Échangez, apportez de la liquidité et voyez l'impact sur le prix, le glissement et les frais se jouer sur la courbe du pool. |
| CTAs | Start swapping · How the pool sets the price | Commencer à échanger · Comment le pool fixe le prix |
| Hero card label | Live quote · tETH → tUSDC pool | Cotation en direct · pool tETH → tUSDC |
| Outcomes H2 | Learn the market by trading in it | Apprendre le marché en y participant |
| Outcome 1 | **Know the price before you sign.** Every quote shows the spot price, your price impact, the pool fee, the route and the minimum you'll receive. | **Connaître le prix avant de signer.** Chaque cotation affiche le prix au comptant, votre impact sur le prix, les frais du pool, l'itinéraire et le minimum que vous recevrez. |
| Outcome 2 | **See why big trades cost more.** Your trade is drawn on the pool's curve, so a bigger order or a thinner pool visibly moves the price. | **Voir pourquoi les gros ordres coûtent plus cher.** Votre échange est tracé sur la courbe du pool : un ordre plus gros ou un pool plus mince déplace visiblement le prix. |
| Outcome 3 | **Weigh what liquidity earns against what it risks.** Deposit into a pool, watch fees come in from other traders, and compare your position with simply holding. | **Peser ce que la liquidité rapporte et ce qu'elle risque.** Déposez dans un pool, regardez les frais des autres traders s'accumuler et comparez votre position à une simple détention. |
| Two pools H2 | Same trade, two pools | Même échange, deux pools |
| Two pools body | A pool's depth decides your price. Slide the amount and compare the deep tETH/tUSDC pool with the thin tLINK/tUSDC one. | La profondeur d'un pool décide de votre prix. Faites glisser le montant et comparez le pool profond tETH/tUSDC au pool mince tLINK/tUSDC. |
| Two pools labels | You spend · Deep pool · Thin pool · Price impact · You receive | Vous dépensez · Pool profond · Pool mince · Impact sur le prix · Vous recevez |
| Demo H2 | What you can do in the demo | Ce que vous pouvez faire dans la démo |
| Demo items | **Swap** any pair, with direct or multi-hop routes. · **Provide liquidity** and receive LP tokens for your share. · **Vote on fees** as a liquidity provider. · **Read your history**, failed transactions included. | **Échanger** n'importe quelle paire, en direct ou par plusieurs pools. · **Apporter de la liquidité** et recevoir des jetons LP pour votre part. · **Voter sur les frais** en tant que fournisseur de liquidité. · **Relire votre historique**, transactions échouées comprises. |
| Who H2 | Built for learning together | Pensé pour apprendre ensemble |
| Who body | Fluidswap is part of Monark's DeFi demos: open-source reference apps that students, developers and ambassadors use in courses, hackathons and workshops. Everyone gets the same pools and the same test tokens, and "Reset demo" puts the room back to the start. | Fluidswap fait partie des démos DeFi de Monark : des applications de référence open source que les étudiants, les développeurs et les ambassadeurs utilisent en cours, en hackathon et en atelier. Tout le monde a les mêmes pools et les mêmes jetons de test, et « Réinitialiser la démo » remet la salle au point de départ. |
| Who audiences | Students meeting AMMs for the first time · Developers about to integrate a swap · Ambassadors running a DeFi workshop | Étudiants qui découvrent les AMM · Développeurs sur le point d'intégrer un échange · Ambassadeurs qui animent un atelier DeFi |
| FAQ H2 | Questions | Questions |
| Closing | Make your first swap. It's all test tokens. · Start swapping | Faites votre premier échange. Ce ne sont que des jetons de test. · Commencer à échanger |

**FAQ**

| Question | Answer |
|-|-|
| Is any of this real money? / Est-ce de l'argent réel ? | No. Fluidswap runs on simulated testnet tokens (tETH, tWBTC, tUSDC, tDAI, tLINK) in your browser. No wallet is really connected and nothing is signed. / Non. Fluidswap fonctionne avec des jetons de testnet simulés (tETH, tWBTC, tUSDC, tDAI, tLINK), dans votre navigateur. Aucun portefeuille n'est vraiment connecté et rien n'est signé. |
| What is an automated market maker? / Qu'est-ce qu'un teneur de marché automatisé ? | A smart contract that holds two tokens and always quotes a price from the ratio of its reserves (x · y = k), instead of matching buyers with sellers. / Un contrat intelligent qui détient deux jetons et donne toujours un prix à partir du rapport de ses réserves (x · y = k), au lieu d'apparier acheteurs et vendeurs. |
| Why did I receive less than the spot price? / Pourquoi ai-je reçu moins que le prix au comptant ? | Two reasons: the pool fee, and your own price impact, since your trade changes the reserves as it executes. The quote shows both before you sign. / Deux raisons : les frais du pool, et votre propre impact sur le prix, puisque votre échange modifie les réserves pendant qu'il s'exécute. La cotation affiche les deux avant la signature. |
| What's the difference between price impact and slippage? / Quelle différence entre impact sur le prix et glissement ? | Price impact is the move your trade causes, known in advance. Slippage is the extra move caused by other trades landing first; your tolerance caps it, or the swap reverts. / L'impact sur le prix est le mouvement que cause votre échange, connu à l'avance. Le glissement est le mouvement supplémentaire causé par d'autres échanges passés avant le vôtre ; votre tolérance le plafonne, sinon l'échange est annulé. |
| What is impermanent loss? / Qu'est-ce que la perte temporaire ? | When prices move, a pool rebalances your deposit toward the token that fell. Compared with just holding, you can end up with less value; fees may or may not make up for it. / Quand les prix bougent, le pool rééquilibre votre dépôt vers le jeton qui a baissé. Comparé à une simple détention, vous pouvez vous retrouver avec moins de valeur ; les frais compensent parfois, pas toujours. |
| Can I use it in a workshop? / Puis-je l'utiliser en atelier ? | Yes. Each browser keeps its own demo state, and "Reset demo" in the demo controls restores the starting pools and balances. / Oui. Chaque navigateur garde son propre état de démo, et « Réinitialiser la démo » dans les contrôles de démo rétablit les pools et les soldes de départ. |
| How is Fluidswap different from Yieldmine, BorrowX and VaultLend? / En quoi Fluidswap diffère de Yieldmine, BorrowX et VaultLend ? | Fluidswap is the trader's view: swapping and providing liquidity. Yieldmine is for lenders earning yield, BorrowX walks a borrower through one loan, and VaultLend shows the protocol's risk dashboard. / Fluidswap, c'est le point de vue du trader : échanger et apporter de la liquidité. Yieldmine s'adresse aux prêteurs qui cherchent du rendement, BorrowX accompagne un emprunteur pas à pas, et VaultLend montre le tableau de bord des risques du protocole. |

### How it works

| Slot | English | Français |
|-|-|-|
| H1 | How the pool sets the price | Comment le pool fixe le prix |
| Intro | No order book, no market maker on the other side: just a contract with two piles of tokens and one rule. Here's that rule, and everything that follows from it. | Pas de carnet d'ordres, pas de contrepartie humaine : juste un contrat, deux réserves de jetons et une règle. Voici cette règle, et tout ce qui en découle. |
| 1 H2 | One rule: x · y = k | Une seule règle : x · y = k |
| 1 body | The pool holds x of one token and y of the other. A trade may change x and y, but their product k must not shrink. The price is simply y ÷ x. Drag the trade size and see where the point lands. | Le pool détient x d'un jeton et y de l'autre. Un échange peut modifier x et y, mais leur produit k ne doit pas diminuer. Le prix, c'est simplement y ÷ x. Faites varier la taille de l'échange et regardez où tombe le point. |
| Explorer labels | Trade size · Pool depth · Deep · Thin · Spot price · Your average price · Price impact | Taille de l'échange · Profondeur du pool · Profond · Mince · Prix au comptant · Votre prix moyen · Impact sur le prix |
| 2 H2 | Price impact vs slippage | Impact sur le prix ou glissement |
| 2 body | Price impact is caused by you and is known when you sign. Slippage is caused by others, between your signature and the block. Your tolerance turns it into a hard floor: the minimum received. | L'impact sur le prix vient de vous et il est connu quand vous signez. Le glissement vient des autres, entre votre signature et le bloc. Votre tolérance en fait un plancher strict : le minimum reçu. |
| 3 H2 | Fees and liquidity providers | Les frais et les fournisseurs de liquidité |
| 3 body | Each swap leaves its fee in the pool, so the pool grows for the people who funded it. Deposit both tokens at the current ratio and you receive LP tokens: your claim on a share of the reserves, fees included. | Chaque échange laisse ses frais dans le pool, qui grossit au profit de ceux qui l'ont financé. Déposez les deux jetons au ratio actuel et vous recevez des jetons LP : votre droit sur une part des réserves, frais compris. |
| IL example | You deposit 1 tETH + 3,200 tUSDC ($6,400). tETH rises 50 %. Arbitrage rebalances the pool; your share is now 0.816 tETH + 3,919 tUSDC = $7,838. Holding would be worth $8,000: a 2.0 % impermanent loss, before fees. | Vous déposez 1 tETH + 3 200 tUSDC (6 400 $). Le tETH monte de 50 %. L'arbitrage rééquilibre le pool ; votre part vaut maintenant 0,816 tETH + 3 919 tUSDC = 7 838 $. En détenant simplement, vous auriez 8 000 $ : une perte temporaire de 2,0 %, avant frais. |
| 4 H2 | Routes | Les itinéraires |
| 4 body | No tWBTC/tUSDC pool? The swap goes through tETH: two pools, two fees, two impacts. Fluidswap tries every route up to three pools and picks the one that gives you the most. | Pas de pool tWBTC/tUSDC ? L'échange passe par le tETH : deux pools, deux frais, deux impacts. Fluidswap essaie tous les itinéraires jusqu'à trois pools et retient celui qui vous rapporte le plus. |
| 5 H2 | Fee votes | Les votes sur les frais |
| 5 body | Liquidity providers carry the risk, so they choose the fee. A proposal passes if more LP tokens vote for it than against, once half the pool's LP tokens have voted. | Les fournisseurs de liquidité portent le risque, alors ce sont eux qui choisissent les frais. Une proposition passe si plus de jetons LP votent pour que contre, une fois que la moitié des jetons LP du pool ont voté. |
| Analogy | A market scale: add on one side and the other must give. A pool works the same way, except the scale never runs out: every extra unit costs more than the last. | Une balance de marché : ajoutez d'un côté et l'autre doit céder. Un pool fonctionne pareil, sauf que la balance ne s'épuise jamais : chaque unité supplémentaire coûte plus cher que la précédente. |
| Dev H2 | For developers | Pour les développeurs |
| Dev body | Each action in the demo maps to one contract call. The simulation lives in `src/lib/demo/` behind typed functions, so it can be swapped for wagmi/viem without touching the UI. | Chaque action de la démo correspond à un appel de contrat. La simulation vit dans `src/lib/demo/` derrière des fonctions typées : on peut la remplacer par wagmi/viem sans toucher à l'interface. |
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
| Slippage | Slippage tolerance · Custom · Your swap reverts if the price moves more than this before it lands. | Tolérance de glissement · Personnalisée · Votre échange est annulé si le prix bouge davantage avant d'être exécuté. |
| Curve panel | Your trade on the curve · Now · After your swap · Reserves | Votre échange sur la courbe · Maintenant · Après votre échange · Réserves |
| Pending / confirmed | Waiting for the network… · Swapped {in} for {out} | En attente du réseau… · {in} échangés contre {out} |
| Failed: slippage | Another trade moved the price by {move} before yours landed. That's beyond your {tolerance} tolerance, so the swap reverted. Only the network fee was spent. | Un autre échange a déplacé le prix de {move} avant le vôtre. C'est au-delà de votre tolérance de {tolerance} : l'échange a été annulé. Seuls les frais de réseau ont été dépensés. |
| Failed: rejected | You rejected the request in your wallet. Nothing was sent. | Vous avez refusé la demande dans votre portefeuille. Rien n'a été envoyé. |
| Failed: reverted | The transaction failed on the network. Your tokens didn't move. | La transaction a échoué sur le réseau. Vos jetons n'ont pas bougé. |
| Pools | Total value locked · 24 h volume · 24 h fees · Fee APR · Your positions · Create a pool | Valeur totale bloquée · Volume 24 h · Frais 24 h · APR des frais · Vos positions · Créer un pool |
| Empty: positions | You don't provide liquidity yet. Add to a pool to earn a share of its fees. | Vous n'apportez pas encore de liquidité. Déposez dans un pool pour toucher une part de ses frais. |
| Position | Your share · Value · Fees earned · vs holding · Add · Remove · LP tokens | Votre part · Valeur · Frais gagnés · par rapport à la détention · Ajouter · Retirer · Jetons LP |
| Create pool | This pair has no pool yet. Your deposit sets its starting price. · Your price is {pct} away from the reference price. Arbitrage traders will close the gap, at your expense. | Cette paire n'a pas encore de pool. Votre dépôt fixe son prix de départ. · Votre prix s'écarte de {pct} du prix de référence. Les arbitragistes combleront l'écart, à vos dépens. |
| Vote | Proposal · Lower the fee to {fee} · For · Against · Quorum · Your voting weight · Vote for · Vote against · End the vote now (demo) · Passed, fee is now {fee} · Rejected, fee stays {fee} · Only liquidity providers of this pool can vote. | Proposition · Baisser les frais à {fee} · Pour · Contre · Quorum · Votre poids de vote · Voter pour · Voter contre · Clore le vote maintenant (démo) · Adoptée, les frais passent à {fee} · Rejetée, les frais restent à {fee} · Seuls les fournisseurs de liquidité de ce pool peuvent voter. |
| Activity | Your history · All · Swaps · Liquidity · Votes · Failed | Votre historique · Tout · Échanges · Liquidité · Votes · Échecs |
| Empty: activity | Nothing here yet. Make a swap and it will show up with its receipt. | Rien pour l'instant. Faites un échange et il apparaîtra ici avec son reçu. |
| Demo controls | Demo controls · Slow network · Fail the next transaction · Market moves during the next swap · Live market · Reset demo · Test tokens and pools go back to where they started. | Contrôles de démo · Réseau lent · Faire échouer la prochaine transaction · Le marché bouge pendant le prochain échange · Marché en direct · Réinitialiser la démo · Les jetons de test et les pools reviennent à leur état de départ. |
| Disclaimer | Testnet demo · not financial advice · no real funds | Démo sur testnet · pas un conseil financier · aucun fonds réel |
| Storage error | Your browser isn't saving the demo, so it will restart when you reload. | Votre navigateur n'enregistre pas la démo : elle repartira de zéro au rechargement. |
| 404 | This page slipped out of the pool. · Back to home · Open the exchange | Cette page a glissé hors du pool. · Retour à l'accueil · Ouvrir la plateforme |

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by the guidelines: cream / espresso tokens derived from `#f88d10` with `--surface-tint: 1` (§3 token block pasted over the `theme.json` base), Nunito Sans 400/600/700/800, pill actions, 1rem cards, borders not shadows, flat orange only, `primary-ink` for orange text on cream.

- **Layout and rhythm.** Home: asymmetric hero (copy left, curve card right on desktop; stacked on mobile) → outcomes (three columns, outline icon top-left) → "same trade, two pools" as one wide interactive band → four deep links in a 2 × 2 grid → photo + audiences → FAQ (single 68ch column, native `<details>`) → closing band. Section divider used twice. The app is a trading tool: on desktop the swap panel (fixed ~440px) sits beside the curve panel; on mobile they stack with the swap panel first and the curve collapsible under the quote. Pool page: two columns (pool facts + chart left, position and vote right), stacked on mobile. Monospace only for addresses and hashes; amounts use tabular figures.
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
- **Screenshots** are in `docs/screenshots/`: every page and flow at 390 and 1440 px, in light and dark, in English, plus the home page, the swap flow and a pool page in French.
