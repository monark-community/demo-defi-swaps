import { TOKENS } from "./tokens"
import type { Pool, Position, TokenSymbol } from "./types"

/**
 * Constant-product AMM math (Uniswap v2 style), as pure functions.
 * The pool keeps x · y = k; the fee stays in the pool for its LPs.
 */

/** Output of swapping `amountIn` into a pool with reserves (rIn, rOut) and fee. */
export function getAmountOut(amountIn: number, rIn: number, rOut: number, fee: number): number {
  if (amountIn <= 0 || rIn <= 0 || rOut <= 0) return 0
  const inWithFee = amountIn * (1 - fee)
  return (inWithFee * rOut) / (rIn + inWithFee)
}

/** Reserves of a pool seen from the input token's side. */
export function sided(pool: Pool, tokenIn: TokenSymbol) {
  const inIsA = pool.a === tokenIn
  return {
    rIn: inIsA ? pool.reserveA : pool.reserveB,
    rOut: inIsA ? pool.reserveB : pool.reserveA,
    tokenOut: inIsA ? pool.b : pool.a,
    inIsA,
  }
}

export interface Hop {
  poolId: string
  tokenIn: TokenSymbol
  tokenOut: TokenSymbol
  amountIn: number
  amountOut: number
  fee: number
  rIn: number
  rOut: number
  /** Reserves after this hop. */
  rInAfter: number
  rOutAfter: number
  /** Price impact of this hop alone (excluding the fee), as a fraction. */
  impact: number
}

export interface Quote {
  tokenIn: TokenSymbol
  tokenOut: TokenSymbol
  amountIn: number
  amountOut: number
  hops: Hop[]
  /** Spot rate (tokenOut per tokenIn) through the route, before fees and impact. */
  spotRate: number
  /** Effective rate you get. */
  rate: number
  /** Combined fee fraction across hops. */
  feeFraction: number
  /** Fees paid, in tokenIn-equivalent USD. */
  feeUsd: number
  /** Price impact excluding fees, as a fraction. */
  impact: number
  minReceived: number
}

/** Every simple path of at most `maxHops` pools from tokenIn to tokenOut. */
export function findPaths(pools: Pool[], tokenIn: TokenSymbol, tokenOut: TokenSymbol, maxHops = 3): Pool[][] {
  const out: Pool[][] = []
  const live = pools.filter((p) => p.reserveA > 0 && p.reserveB > 0)
  const walk = (token: TokenSymbol, path: Pool[], seen: Set<TokenSymbol>) => {
    if (path.length > maxHops) return
    if (token === tokenOut && path.length > 0) {
      out.push(path)
      return
    }
    for (const pool of live) {
      if (path.includes(pool)) continue
      if (pool.a !== token && pool.b !== token) continue
      const next = pool.a === token ? pool.b : pool.a
      if (seen.has(next)) continue
      const s = new Set(seen)
      s.add(next)
      walk(next, [...path, pool], s)
    }
  }
  walk(tokenIn, [], new Set([tokenIn]))
  return out
}

function quotePath(path: Pool[], tokenIn: TokenSymbol, amountIn: number): Hop[] {
  const hops: Hop[] = []
  let token = tokenIn
  let amount = amountIn
  for (const pool of path) {
    const { rIn, rOut, tokenOut } = sided(pool, token)
    const amountOut = getAmountOut(amount, rIn, rOut, pool.fee)
    const inWithFee = amount * (1 - pool.fee)
    hops.push({
      poolId: pool.id,
      tokenIn: token,
      tokenOut,
      amountIn: amount,
      amountOut,
      fee: pool.fee,
      rIn,
      rOut,
      rInAfter: rIn + amount,
      rOutAfter: rOut - amountOut,
      impact: inWithFee / (rIn + inWithFee),
    })
    token = tokenOut
    amount = amountOut
  }
  return hops
}

/** Best quote across all routes of up to three pools, or null if no route exists. */
export function bestQuote(
  pools: Pool[],
  tokenIn: TokenSymbol,
  tokenOut: TokenSymbol,
  amountIn: number,
  slippageBps: number
): Quote | null {
  if (tokenIn === tokenOut) return null
  const paths = findPaths(pools, tokenIn, tokenOut)
  if (!paths.length) return null
  // With no amount yet, rank routes by a tiny trade so the route is still shown.
  const probe = amountIn > 0 ? amountIn : 1e-9 * Math.max(1, 1 / TOKENS[tokenIn].usd)
  let best: Hop[] | null = null
  for (const path of paths) {
    const hops = quotePath(path, tokenIn, probe)
    const last = hops[hops.length - 1]
    if (!best || (last && last.amountOut > best[best.length - 1]!.amountOut)) best = hops
  }
  if (!best) return null
  const hops =
    amountIn > 0 ? best : best.map((h) => ({ ...h, amountIn: 0, amountOut: 0, rInAfter: h.rIn, rOutAfter: h.rOut, impact: 0 }))
  const spotRate = best.reduce((r, h) => r * (h.rOut / h.rIn), 1)
  const keep = best.reduce((r, h) => r * (1 - h.fee), 1)
  const amountOut = amountIn > 0 ? hops[hops.length - 1]!.amountOut : 0
  const ideal = amountIn * spotRate * keep
  const impact = amountIn > 0 && ideal > 0 ? Math.max(0, 1 - amountOut / ideal) : 0
  const feeUsd = hops.reduce((sum, h) => sum + h.amountIn * h.fee * TOKENS[h.tokenIn].usd, 0)
  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    hops,
    spotRate,
    rate: amountIn > 0 ? amountOut / amountIn : spotRate * keep,
    feeFraction: 1 - keep,
    feeUsd,
    impact,
    minReceived: amountOut * (1 - slippageBps / 10_000),
  }
}

/** Re-run a quote's exact route against current reserves (used when the market moved). */
export function requote(pools: Pool[], quote: Quote): number {
  const path = quote.hops.map((h) => pools.find((p) => p.id === h.poolId))
  if (path.some((p) => !p)) return 0
  const hops = quotePath(path as Pool[], quote.tokenIn, quote.amountIn)
  return hops[hops.length - 1]?.amountOut ?? 0
}

export type ImpactLevel = "low" | "noticeable" | "high"

export function impactLevel(impact: number): ImpactLevel {
  if (impact < 0.01) return "low"
  if (impact <= 0.05) return "noticeable"
  return "high"
}

/** Spot price of A in B. */
export function poolPrice(pool: Pick<Pool, "reserveA" | "reserveB">): number {
  return pool.reserveA > 0 ? pool.reserveB / pool.reserveA : 0
}

export function poolTvlUsd(pool: Pool): number {
  return pool.reserveA * TOKENS[pool.a].usd + pool.reserveB * TOKENS[pool.b].usd
}

/** B needed to pair with `amountA` at the pool's current ratio. */
export function pairedAmount(pool: Pool, token: TokenSymbol, amount: number): number {
  const price = poolPrice(pool)
  return token === pool.a ? amount * price : price > 0 ? amount / price : 0
}

/** LP tokens minted for a deposit (first deposit: geometric mean). */
export function lpForDeposit(pool: Pick<Pool, "reserveA" | "reserveB" | "lpSupply">, amountA: number, amountB: number): number {
  if (pool.lpSupply <= 0 || pool.reserveA <= 0) return Math.sqrt(amountA * amountB)
  return Math.min(amountA / pool.reserveA, amountB / pool.reserveB) * pool.lpSupply
}

export interface PositionView {
  share: number
  amountA: number
  amountB: number
  /** Current value in USD, valuing A at the pool's own price (in B) and B at its reference price. */
  valueUsd: number
  /** What the deposited tokens would be worth now if simply held, same valuation. */
  holdUsd: number
  /** (value - hold) / hold: negative is impermanent loss. */
  vsHold: number
}

/** Value a position at the pool's own price: the classic impermanent-loss view. */
export function viewPosition(pool: Pool, position: Position): PositionView {
  const share = pool.lpSupply > 0 ? position.lp / pool.lpSupply : 0
  const amountA = share * pool.reserveA
  const amountB = share * pool.reserveB
  const price = poolPrice(pool)
  const bUsd = TOKENS[pool.b].usd
  const valueUsd = (amountA * price + amountB) * bUsd
  const holdUsd = (position.depositedA * price + position.depositedB) * bUsd
  return { share, amountA, amountB, valueUsd, holdUsd, vsHold: holdUsd > 0 ? valueUsd / holdUsd - 1 : 0 }
}

/** Fee APR from the last 24 h of fees. */
export function feeApr(pool: Pool): number {
  const tvl = poolTvlUsd(pool)
  return tvl > 0 ? (pool.feesUsd24h * 365) / tvl : 0
}
