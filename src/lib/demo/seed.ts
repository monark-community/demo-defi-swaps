import { poolPrice } from "./amm"
import { prng, seededAddress, seededHash } from "./ids"
import { TOKENS } from "./tokens"
import type { ActivityEntry, DemoState, Pool, Position, PricePoint, TokenSymbol, Trade } from "./types"

/**
 * The starting world: five pools at the shared reference prices, a visitor
 * with test tokens and two liquidity positions, one open fee vote, and a few
 * past actions. Everything is deterministic except timestamps (relative to now).
 */

export const YOUR_ADDRESS = "0x5c1E8d3a47B9f02C6e41D7a90b3F28c61E4ba7D2"

const HOUR = 3_600_000
const DAY = 24 * HOUR

interface PoolSeed {
  id: string
  a: TokenSymbol
  b: TokenSymbol
  reserveA: number
  reserveB: number
  fee: number
  volumeUsd24h: number
  /** Price of A in B thirty days ago (the history walks from here to today's). */
  startPrice: number
  /** Volatility per 4-hour step (log). */
  vol: number
  ageDays: number
}

const POOL_SEEDS: PoolSeed[] = [
  { id: "eth-usdc", a: "tETH", b: "tUSDC", reserveA: 420, reserveB: 1_344_000, fee: 0.003, volumeUsd24h: 540_000, startPrice: 3050, vol: 0.011, ageDays: 210 },
  { id: "wbtc-eth", a: "tWBTC", b: "tETH", reserveA: 18.5, reserveB: 370, fee: 0.003, volumeUsd24h: 160_000, startPrice: 20.6, vol: 0.006, ageDays: 180 },
  { id: "usdc-dai", a: "tUSDC", b: "tDAI", reserveA: 900_000, reserveB: 900_000, fee: 0.0005, volumeUsd24h: 1_200_000, startPrice: 1.0003, vol: 0.0002, ageDays: 240 },
  { id: "link-eth", a: "tLINK", b: "tETH", reserveA: 44_000, reserveB: 199.375, fee: 0.003, volumeUsd24h: 58_000, startPrice: 0.0044, vol: 0.012, ageDays: 120 },
  { id: "link-usdc", a: "tLINK", b: "tUSDC", reserveA: 2_400, reserveB: 34_800, fee: 0.01, volumeUsd24h: 2_100, startPrice: 15.4, vol: 0.016, ageDays: 45 },
]

function iso(ms: number) {
  return new Date(ms).toISOString()
}

/** 30 days of 4-hour prices: a seeded random walk bent to land on today's price. */
function seedHistory(seed: PoolSeed, now: number): PricePoint[] {
  const rnd = prng(`hist:${seed.id}`)
  const steps = 180
  const end = seed.reserveB / seed.reserveA
  const walk: number[] = [0]
  for (let i = 1; i <= steps; i++) {
    // Sum of uniforms: a cheap, bounded bell shape.
    const z = (rnd() + rnd() + rnd() - 1.5) * 2
    walk.push(walk[i - 1]! + z * seed.vol)
  }
  const target = Math.log(end) - Math.log(seed.startPrice)
  const drift = (target - walk[steps]!) / steps
  const points: PricePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const p = seed.startPrice * Math.exp(walk[i]! + drift * i)
    points.push({ t: iso(now - (steps - i) * 4 * HOUR), p })
  }
  points[points.length - 1] = { t: iso(now), p: end }
  return points
}

function seedTrades(seed: PoolSeed, now: number): Trade[] {
  const rnd = prng(`trades:${seed.id}`)
  const price = seed.reserveB / seed.reserveA
  const trades: Trade[] = []
  let at = now - 4 * 60_000
  for (let i = 0; i < 8; i++) {
    const aToB = rnd() < 0.5
    const size = 0.0005 + rnd() * 0.004
    const amountIn = (aToB ? seed.reserveA : seed.reserveB) * size
    const amountOut = (aToB ? amountIn * price : amountIn / price) * (1 - seed.fee) * (1 - size)
    trades.push({
      id: `${seed.id}-t${i}`,
      at: iso(at),
      trader: seededAddress(`${seed.id}:trader:${Math.floor(rnd() * 12)}`),
      tokenIn: aToB ? seed.a : seed.b,
      amountIn,
      tokenOut: aToB ? seed.b : seed.a,
      amountOut,
      hash: seededHash(`${seed.id}:trade:${i}`),
    })
    at -= (3 + rnd() * 14) * 60_000
  }
  return trades
}

function makePool(seed: PoolSeed, now: number): Pool {
  return {
    id: seed.id,
    a: seed.a,
    b: seed.b,
    reserveA: seed.reserveA,
    reserveB: seed.reserveB,
    fee: seed.fee,
    lpSupply: Math.sqrt(seed.reserveA * seed.reserveB),
    address: seededAddress(`pool:${seed.id}`),
    createdAt: iso(now - seed.ageDays * DAY),
    volumeUsd24h: seed.volumeUsd24h,
    feesUsd24h: seed.volumeUsd24h * seed.fee,
    history: seedHistory(seed, now),
    trades: seedTrades(seed, now),
    proposal: null,
  }
}

/** A position holding `share` of the pool now, deposited when the price was `p0`. */
function makePosition(pool: Pool, share: number, p0: number, openedAt: number, feesUsd: number): Position {
  const price = poolPrice(pool)
  const a = share * pool.reserveA
  const b = share * pool.reserveB
  return {
    poolId: pool.id,
    lp: share * pool.lpSupply,
    depositedA: a * Math.sqrt(price / p0),
    depositedB: b * Math.sqrt(p0 / price),
    openedAt: iso(openedAt),
    feesUsd,
  }
}

export function createSeed(): DemoState {
  const now = Date.now()
  const pools = POOL_SEEDS.map((s) => makePool(s, now))
  const byId = (id: string) => pools.find((p) => p.id === id)!

  const ethUsdc = byId("eth-usdc")
  const linkUsdc = byId("link-usdc")
  const positions = [
    makePosition(ethUsdc, 0.0025, 3050, now - 34 * DAY, 41.37),
    makePosition(linkUsdc, 0.08, 15.1, now - 12 * DAY, 18.64),
  ]

  // Thin pool, high fee: its LPs are voting to lower it. For 31 %, against 34 %:
  // the visitor's 8 % decides the outcome.
  linkUsdc.proposal = {
    id: "prop-link-usdc-1",
    newFee: 0.003,
    forLp: 0.31 * linkUsdc.lpSupply,
    againstLp: 0.34 * linkUsdc.lpSupply,
    quorum: 0.5,
    endsAt: iso(now + 2 * DAY + 5 * HOUR),
    yourVote: null,
    yourWeight: 0,
    status: "open",
  }

  const p = positions
  const activity: ActivityEntry[] = [
    {
      id: "seed-swap-fail",
      at: iso(now - 2 * DAY - 3 * HOUR),
      kind: "swap",
      status: "failed",
      error: "slippage",
      hash: seededHash("seed:swap-fail"),
      route: ["link-eth"],
      tokenIn: "tETH",
      amountIn: 0.8,
      tokenOut: "tLINK",
      amountOut: 175.12,
      move: 0.0184,
      toleranceBps: 50,
      usd: 0.8 * TOKENS.tETH.usd,
    },
    {
      id: "seed-swap",
      at: iso(now - 4 * DAY - 6 * HOUR),
      kind: "swap",
      status: "confirmed",
      hash: seededHash("seed:swap"),
      route: ["eth-usdc"],
      tokenIn: "tUSDC",
      amountIn: 1200,
      tokenOut: "tETH",
      amountOut: 0.37356,
      usd: 1200,
      feeUsd: 3.6,
    },
    {
      id: "seed-add-link",
      at: iso(now - 12 * DAY),
      kind: "add",
      status: "confirmed",
      hash: seededHash("seed:add-link"),
      poolId: "link-usdc",
      amountA: p[1]!.depositedA,
      amountB: p[1]!.depositedB,
      lp: p[1]!.lp,
      usd: p[1]!.depositedA * 15.1 + p[1]!.depositedB,
    },
    {
      id: "seed-add-eth",
      at: iso(now - 34 * DAY),
      kind: "add",
      status: "confirmed",
      hash: seededHash("seed:add-eth"),
      poolId: "eth-usdc",
      amountA: p[0]!.depositedA,
      amountB: p[0]!.depositedB,
      lp: p[0]!.lp,
      usd: p[0]!.depositedA * 3050 + p[0]!.depositedB,
    },
    {
      id: "seed-faucet",
      at: iso(now - 34 * DAY - 2 * HOUR),
      kind: "faucet",
      status: "confirmed",
      hash: seededHash("seed:faucet"),
    },
  ]

  return {
    version: 1,
    wallet: { status: "disconnected", address: YOUR_ADDRESS, lastError: null },
    balances: { tETH: 3.5, tWBTC: 0.12, tUSDC: 8_400, tDAI: 2_500, tLINK: 600 },
    pools,
    positions,
    activity,
    settings: { slow: false, failNext: false, marketMove: false, liveMarket: true, slippageBps: 50 },
  }
}

/** What the faucet hands out per request. */
export const FAUCET: Record<TokenSymbol, number> = {
  tETH: 1,
  tWBTC: 0.02,
  tUSDC: 2_000,
  tDAI: 2_000,
  tLINK: 100,
}
