# Fluidswap by Monark

Fluidswap is a testnet exchange for learning how automated market makers (AMMs) work. You can swap tokens, provide liquidity and vote on a pool's fee. On every quote, the site shows where the price comes from: spot price, your own price impact, the pool fee, the route and the minimum you'll receive. It also draws your trade on the pool's x · y = k curve.

It is part of the Monark DeFi demos. Fluidswap is the trader's view; [Yieldmine](https://yieldmine.monark.io/), [BorrowX](https://borrowx.monark.io/) and [VaultLend](https://vaultlend.monark.io/) cover lending, borrowing and protocol risk.

- Project documentation: https://www.monark.io/en/project/defi-swaps
- **Demo · simulated data.** Testnet demo · not financial advice · no real funds. There is no real wallet, chain or backend.

## Run it locally

Requirements: Node 22 and pnpm 10.

```sh
pnpm install
pnpm dev            # http://localhost:3000 (redirects to /en or /fr)
```

Checks and production build:

```sh
pnpm lint
pnpm typecheck      # next typegen && tsc --noEmit
pnpm build
pnpm start
```

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` (default `https://fluidswap.monark.io`) only changes the absolute URLs used in metadata, the sitemap and `robots.txt`.

## What's in the site

| Route | What it is |
|-|-|
| `/{en,fr}` | Home: the live curve hero, "same trade, two pools", what the demo does, who it's for, FAQ |
| `/{locale}/app` | Swap: the registry `swap-form` with a full quote, slippage settings, a high-impact acknowledgement, your trade on the curve, and the reserve bars |
| `/{locale}/app/pools` | Pools: totals, your positions, all pools with fee APR, and pairs that have no pool yet |
| `/{locale}/app/pools/[id]` | One pool: price chart, reserves, live trades, your position (add or remove liquidity, fees earned, compared with holding) and the LP fee vote. For a pair with no pool, the form to create it |
| `/{locale}/app/activity` | Your history (failed transactions included), your stats, and volume by pool |
| `/{locale}/how-it-works` | The mechanics, with an interactive curve explorer, an impermanent-loss example, routes, fee votes and the contract calls |
| `/{locale}/credits` | Photo, type and icon credits |
| `/{locale}/pricing` | Internal strategy review only. Nothing links to it, it isn't in the sitemap, and it is `noindex` |

## How the simulation works

Everything lives behind a small typed data layer in `src/lib/demo/`. The UI never touches it directly; it only uses hooks and actions, so you could swap in wagmi/viem without changing any UI code.

| File | Role |
|-|-|
| `types.ts` | Domain shapes: pools, positions, proposals, activity, wallet, transactions |
| `tokens.ts` | The shared testnet tokens and reference prices (tETH $3,200, tWBTC $64,000, tUSDC $1, tDAI $1, tLINK $14.50), the pairs and the parsing helpers |
| `amm.ts` | Pure constant-product maths (Uniswap v2 style): `getAmountOut`, best route across up to 3 pools, price impact, LP minting, position value against holding |
| `seed.ts` | The starting world: 5 pools, test-token balances, 2 liquidity positions, an open fee vote, a short history |
| `store.ts` | External store persisted to `localStorage` (every access is wrapped in try/catch), plus the promise behind the wallet prompt |
| `chain.ts` | Each transaction's lifecycle: wallet prompt (confirm or reject), then pending with a hash for 1.2–2.4 s (3–6 s on a slow network), then confirmed or failed |
| `ops.ts` | The state changes behind each contract call (swap, add, remove, vote, faucet), plus the background "live market" of other traders |
| `wallet.ts` | Simulated sign-in and disconnect |

Every value-moving action can fail in a realistic way:

- **Rejected** in the wallet prompt.
- **Reverted** on the network, using "Fail the next transaction".
- **Slippage exceeded**, using "Market moves during the next swap". Another trader lands first and moves the price about 1.8 %; the swap reverts if the output falls below your minimum received.

You'll find these switches, plus "Slow network", "Live market" and **Reset demo**, under **Demo controls** in the exchange bar.

## Project structure

```
src/
  app/[locale]/        pages (home, app/*, how-it-works, credits, pricing), layout, 404, error, OG image
  app/sitemap.ts       sitemap (without /pricing), robots.ts, icon.svg
  components/ui/       shadcn components from the Monark UI registry (swap-form, token-amount,
                       tx-status, wallet, connect-wallet, network-badge, …), restyled to Monark pills
  components/demo/     the exchange: swap view, pools, pool page, liquidity, fee vote, activity, prompts
  components/diagrams/ curve chart, reserve bars, price chart
  components/home/     hero curve, "same trade, two pools"
  components/how/      curve explorer, route and LP diagrams
  components/site/     Monark shell: brand, nav, Demo chip, EN/FR switch, theme toggle, footer
  i18n/                typed EN/FR dictionaries (French must match the English shape)
  lib/demo/            the simulated chain, wallet and AMM (see above)
  proxy.ts             redirects / to the visitor's language
docs/
  site-plan.md         product, content, aesthetics and flows (kept in sync with what shipped)
  assets.md            image sources and credits
  screenshots/         Playwright captures of every page and flow
scripts/screenshots.mjs
```

Theme: the Monark `@monark/ui` base theme, with the brand guidelines' cream and espresso tokens pasted over it (`src/app/globals.css`). The `@monark` registry is declared in `components.json`.

## Screenshots

With a production server running on port 3131 (`pnpm build && pnpm start -p 3131`), run:

```sh
pnpm screenshots
```

This writes `docs/screenshots/<locale>-<width>-<theme>-<name>.png`: every page and every key flow at 390 and 1440 px, in light and dark, in English, plus the home page and the swap flow in French.

## Deploy to Vercel

Import the repository in Vercel and keep the framework defaults (Next.js, `pnpm install`, `pnpm build`). No `vercel.json` and no environment variables are needed. Node 22 is pinned in `package.json` `engines`.

Open source, part of [Monark](https://www.monark.io): Fostering Collaboration within the Web3 Community.
