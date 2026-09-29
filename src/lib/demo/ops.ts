"use client"

import { getAmountOut, lpForDeposit, poolPrice, requote, sided, type Quote } from "./amm"
import { randomAddress, randomHash, randomId, seededAddress } from "./ids"
import { FAUCET } from "./seed"
import { getDemo, setSettings, update } from "./store"
import { pairById, TOKENS, TOKEN_LIST } from "./tokens"
import type { ActivityEntry, DemoState, Pool, TokenSymbol, TxError } from "./types"

/**
 * State transitions of the simulated protocol. Each maps to one contract call
 * (router.swapExactTokensForTokens, router.addLiquidity, router.removeLiquidity,
 * governor.castVote / execute, faucet.drip) and runs when the block "lands".
 */

const MAX_TRADES = 30
const MAX_HISTORY = 400

function nowIso() {
  return new Date().toISOString()
}

/** Apply one trade to a pool: reserves, price history, trade feed, volume, fees; accrue LP fees. */
function tradeIntoPool(
  s: DemoState,
  poolId: string,
  tokenIn: TokenSymbol,
  amountIn: number,
  amountOut: number,
  trader: string,
  hash: string,
  you = false
): DemoState {
  const pool = s.pools.find((p) => p.id === poolId)
  if (!pool) return s
  const inIsA = pool.a === tokenIn
  const tokenOut = inIsA ? pool.b : pool.a
  const next: Pool = {
    ...pool,
    reserveA: inIsA ? pool.reserveA + amountIn : pool.reserveA - amountOut,
    reserveB: inIsA ? pool.reserveB - amountOut : pool.reserveB + amountIn,
  }
  const at = nowIso()
  const usd = amountIn * TOKENS[tokenIn].usd
  const feeUsd = usd * pool.fee
  next.history = [...pool.history, { t: at, p: poolPrice(next) }].slice(-MAX_HISTORY)
  next.trades = [{ id: randomId("tr"), at, trader, you, tokenIn, amountIn, tokenOut, amountOut, hash }, ...pool.trades].slice(0, MAX_TRADES)
  next.volumeUsd24h = pool.volumeUsd24h + usd
  next.feesUsd24h = pool.feesUsd24h + feeUsd
  const positions = s.positions.map((pos) =>
    pos.poolId === poolId && pool.lpSupply > 0 ? { ...pos, feesUsd: pos.feesUsd + feeUsd * (pos.lp / pool.lpSupply) } : pos
  )
  return { ...s, pools: s.pools.map((p) => (p.id === poolId ? next : p)), positions }
}

function log(s: DemoState, entry: Omit<ActivityEntry, "id" | "at">): DemoState {
  return { ...s, activity: [{ id: randomId("act"), at: nowIso(), ...entry }, ...s.activity].slice(0, 200) }
}

export function logFailure(entry: Omit<ActivityEntry, "id" | "at" | "status"> & { error: TxError }) {
  update((s) => log(s, { ...entry, status: "failed" }))
}

/* ------------------------------------------------------------------------ */
/* Swap                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Settle a quoted swap. If "market moves" is on, another trader lands first in
 * the same direction on the first pool; the swap then re-prices and reverts
 * if the output falls below the minimum received.
 */
export function settleSwap(quote: Quote, hash: string): { error: TxError; move?: number } | void {
  const demo = getDemo()
  if (!demo) return { error: "reverted" }
  if ((demo.balances[quote.tokenIn] ?? 0) + 1e-12 < quote.amountIn) return { error: "reverted" }

  let move: number | undefined
  if (demo.settings.marketMove) {
    setSettings({ marketMove: false })
    const first = quote.hops[0]!
    const pool = demo.pools.find((p) => p.id === first.poolId)!
    const { rIn, rOut } = sided(pool, first.tokenIn)
    const before = poolPrice(pool)
    const frontIn = rIn * 0.0092
    const frontOut = getAmountOut(frontIn, rIn, rOut, pool.fee)
    update((s) => tradeIntoPool(s, pool.id, first.tokenIn, frontIn, frontOut, seededAddress("front-runner"), randomHash()))
    const after = getDemo()!.pools.find((p) => p.id === pool.id)!
    move = Math.abs(poolPrice(after) / before - 1)
  }

  const current = getDemo()!
  const amountOut = move !== undefined ? requote(current.pools, quote) : quote.amountOut
  if (amountOut + 1e-12 < quote.minReceived) return { error: "slippage", move }

  update((s) => {
    let next = s
    let amount = quote.amountIn
    let token = quote.tokenIn
    for (const hop of quote.hops) {
      const pool = next.pools.find((p) => p.id === hop.poolId)!
      const { rIn, rOut, tokenOut } = sided(pool, token)
      const out = getAmountOut(amount, rIn, rOut, pool.fee)
      next = tradeIntoPool(next, pool.id, token, amount, out, s.wallet.address, hash, true)
      amount = out
      token = tokenOut
    }
    next = {
      ...next,
      balances: {
        ...next.balances,
        [quote.tokenIn]: Math.max(0, next.balances[quote.tokenIn] - quote.amountIn),
        [quote.tokenOut]: next.balances[quote.tokenOut] + amount,
      },
    }
    return log(next, {
      kind: "swap",
      status: "confirmed",
      hash,
      route: quote.hops.map((h) => h.poolId),
      tokenIn: quote.tokenIn,
      amountIn: quote.amountIn,
      tokenOut: quote.tokenOut,
      amountOut: amount,
      usd: quote.amountIn * TOKENS[quote.tokenIn].usd,
      feeUsd: quote.feeUsd,
      move,
    })
  })
}

/* ------------------------------------------------------------------------ */
/* Faucet                                                                   */
/* ------------------------------------------------------------------------ */

export function dripFaucet(hash: string) {
  update((s) => {
    const balances = { ...s.balances }
    for (const t of TOKEN_LIST) balances[t] = balances[t] + FAUCET[t]
    return log({ ...s, balances }, { kind: "faucet", status: "confirmed", hash })
  })
}

/* ------------------------------------------------------------------------ */
/* Liquidity                                                                */
/* ------------------------------------------------------------------------ */

/** Deposit into a pool; creates the pool (at this ratio, with `fee`) if it doesn't exist. */
export function settleDeposit(poolId: string, amountA: number, amountB: number, hash: string, fee = 0.003): { error: TxError } | void {
  const demo = getDemo()
  const pair = pairById(poolId)
  if (!demo || !pair) return { error: "reverted" }
  if (demo.balances[pair.a] + 1e-12 < amountA || demo.balances[pair.b] + 1e-12 < amountB) return { error: "reverted" }
  const existing = demo.pools.find((p) => p.id === poolId)

  update((s) => {
    const at = nowIso()
    const pool: Pool =
      existing ??
      ({
        id: poolId,
        a: pair.a,
        b: pair.b,
        reserveA: 0,
        reserveB: 0,
        fee,
        lpSupply: 0,
        address: randomAddress(),
        createdAt: at,
        createdByYou: true,
        volumeUsd24h: 0,
        feesUsd24h: 0,
        history: [],
        trades: [],
        proposal: null,
      } satisfies Pool)
    const minted = lpForDeposit(pool, amountA, amountB)
    const nextPool: Pool = {
      ...pool,
      reserveA: pool.reserveA + amountA,
      reserveB: pool.reserveB + amountB,
      lpSupply: pool.lpSupply + minted,
    }
    nextPool.history = [...pool.history, { t: at, p: poolPrice(nextPool) }].slice(-MAX_HISTORY)
    const pools = existing ? s.pools.map((p) => (p.id === poolId ? nextPool : p)) : [...s.pools, nextPool]
    const had = s.positions.find((p) => p.poolId === poolId)
    const positions = had
      ? s.positions.map((p) =>
          p.poolId === poolId ? { ...p, lp: p.lp + minted, depositedA: p.depositedA + amountA, depositedB: p.depositedB + amountB } : p
        )
      : [...s.positions, { poolId, lp: minted, depositedA: amountA, depositedB: amountB, openedAt: at, feesUsd: 0 }]
    const balances = { ...s.balances, [pair.a]: s.balances[pair.a] - amountA, [pair.b]: s.balances[pair.b] - amountB }
    return log(
      { ...s, pools, positions, balances },
      {
        kind: existing ? "add" : "create",
        status: "confirmed",
        hash,
        poolId,
        amountA,
        amountB,
        lp: minted,
        usd: amountA * TOKENS[pair.a].usd + amountB * TOKENS[pair.b].usd,
      }
    )
  })
}

/** Withdraw `fraction` (0–1] of your position. */
export function settleWithdraw(poolId: string, fraction: number, hash: string): { error: TxError } | void {
  const demo = getDemo()
  const pool = demo?.pools.find((p) => p.id === poolId)
  const position = demo?.positions.find((p) => p.poolId === poolId)
  if (!demo || !pool || !position || fraction <= 0) return { error: "reverted" }

  update((s) => {
    const burn = position.lp * Math.min(1, fraction)
    const share = burn / pool.lpSupply
    const outA = share * pool.reserveA
    const outB = share * pool.reserveB
    const nextPool: Pool = {
      ...pool,
      reserveA: pool.reserveA - outA,
      reserveB: pool.reserveB - outB,
      lpSupply: pool.lpSupply - burn,
    }
    const closing = fraction >= 0.9999
    const positions = closing
      ? s.positions.filter((p) => p.poolId !== poolId)
      : s.positions.map((p) =>
          p.poolId === poolId
            ? {
                ...p,
                lp: p.lp - burn,
                depositedA: p.depositedA * (1 - fraction),
                depositedB: p.depositedB * (1 - fraction),
                feesUsd: p.feesUsd * (1 - fraction),
              }
            : p
        )
    const balances = { ...s.balances, [pool.a]: s.balances[pool.a] + outA, [pool.b]: s.balances[pool.b] + outB }
    return log(
      { ...s, pools: s.pools.map((p) => (p.id === poolId ? nextPool : p)), positions, balances },
      {
        kind: "remove",
        status: "confirmed",
        hash,
        poolId,
        amountA: outA,
        amountB: outB,
        lp: burn,
        usd: outA * TOKENS[pool.a].usd + outB * TOKENS[pool.b].usd,
      }
    )
  })
}

/* ------------------------------------------------------------------------ */
/* Fee vote                                                                 */
/* ------------------------------------------------------------------------ */

export function settleVote(poolId: string, choice: "for" | "against", hash: string): { error: TxError } | void {
  const demo = getDemo()
  const pool = demo?.pools.find((p) => p.id === poolId)
  const position = demo?.positions.find((p) => p.poolId === poolId)
  if (!pool?.proposal || pool.proposal.status !== "open" || !position) return { error: "reverted" }
  update((s) => {
    const pools = s.pools.map((p) =>
      p.id === poolId && p.proposal ? { ...p, proposal: { ...p.proposal, yourVote: choice, yourWeight: position.lp } } : p
    )
    return log({ ...s, pools }, { kind: "vote", status: "confirmed", hash, poolId, vote: choice, lp: position.lp })
  })
}

/** Tally of a proposal as fractions of the LP supply. */
export function tally(pool: Pool) {
  const p = pool.proposal
  if (!p || pool.lpSupply <= 0) return null
  const forLp = p.forLp + (p.yourVote === "for" ? p.yourWeight : 0)
  const againstLp = p.againstLp + (p.yourVote === "against" ? p.yourWeight : 0)
  const turnout = (forLp + againstLp) / pool.lpSupply
  return {
    for: forLp / pool.lpSupply,
    against: againstLp / pool.lpSupply,
    turnout,
    quorumReached: turnout >= p.quorum,
    passing: turnout >= p.quorum && forLp > againstLp,
  }
}

/** Demo shortcut: close the vote now and execute the result. */
export function endVote(poolId: string) {
  update((s) => ({
    ...s,
    pools: s.pools.map((p) => {
      if (p.id !== poolId || !p.proposal || p.proposal.status !== "open") return p
      const t = tally(p)
      const passed = !!t?.passing
      return {
        ...p,
        fee: passed ? p.proposal.newFee : p.fee,
        proposal: { ...p.proposal, status: passed ? "passed" : "rejected", endsAt: nowIso() },
      }
    }),
  }))
}

/* ------------------------------------------------------------------------ */
/* Live market                                                              */
/* ------------------------------------------------------------------------ */

const TRADERS = Array.from({ length: 14 }, (_, i) => seededAddress(`market-trader-${i}`))

/**
 * One background trade by another trader. Mostly arbitrage: when a pool's
 * price has drifted from the reference prices, trades tend to push it back.
 */
export function marketTick() {
  const demo = getDemo()
  if (!demo) return
  const pools = demo.pools.filter((p) => p.reserveA > 0 && p.reserveB > 0)
  if (!pools.length) return
  const pool = pools[Math.floor(Math.random() * pools.length)]!
  const reference = TOKENS[pool.a].usd / TOKENS[pool.b].usd
  const price = poolPrice(pool)
  const drift = price / reference - 1
  // Price too high (A expensive): sell A into the pool, which lowers it.
  let aToB = Math.random() < 0.5
  if (Math.abs(drift) > 0.002 && Math.random() < 0.75) aToB = drift > 0
  const tokenIn = aToB ? pool.a : pool.b
  const { rIn, rOut } = sided(pool, tokenIn)
  const size = Math.abs(drift) > 0.01 ? Math.min(Math.abs(drift) / 3, 0.01) : 0.0004 + Math.random() * 0.0026
  const amountIn = rIn * size
  const amountOut = getAmountOut(amountIn, rIn, rOut, pool.fee)
  const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)]!
  update((s) => tradeIntoPool(s, pool.id, tokenIn, amountIn, amountOut, trader, randomHash()))
}
