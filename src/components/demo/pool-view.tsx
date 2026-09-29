"use client"

import { ArrowLeftIcon, ArrowRightIcon, PauseCircleIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PriceChart } from "@/components/diagrams/price-chart"
import { ReserveBars } from "@/components/diagrams/reserve-bars"
import { NetworkBadge } from "@/components/ui/network-badge"
import { WalletAddress, WalletCopyButton } from "@/components/ui/wallet"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { poolPrice, poolTvlUsd } from "@/lib/demo/amm"
import { useDemo } from "@/lib/demo/store"
import { NETWORK_NAME, pairById } from "@/lib/demo/tokens"
import type { Pool } from "@/lib/demo/types"
import { formatAmount, formatDate, formatPercent, formatPrice, formatRelative, formatUsd, shortAddress } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { FeeVote } from "./fee-vote"
import { CreatePool, PositionCard } from "./liquidity"
import { FeeTier, PageSkeleton } from "./pools-view"
import { PairMark } from "./token-mark"

export function PoolView({ id }: { id: string }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const pp = app.pool
  const pair = pairById(id)

  if (!demo || !pair) return <PageSkeleton />
  const pool = demo.pools.find((p) => p.id === id && p.lpSupply > 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <Link
        href={href(locale, "/app/pools")}
        className="inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {pp.back}
      </Link>

      {!pool ? (
        <CreatePool pairId={id} a={pair.a} b={pair.b} />
      ) : (
        <>
          <PoolHeader pool={pool} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
            <div className="flex flex-col gap-6">
              <PriceCard pool={pool} />
              <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="reserves-title">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="reserves-title" className="text-lg font-extrabold">
                    {pp.reserves}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pp.tvl} <span className="font-bold text-foreground tabular-nums">{formatUsd(poolTvlUsd(pool), locale)}</span>
                  </p>
                </div>
                <ReserveBars
                  className="mt-4"
                  locale={locale}
                  label={pp.reserves}
                  tanks={[
                    { symbol: pool.a, now: pool.reserveA, after: pool.reserveA },
                    { symbol: pool.b, now: pool.reserveB, after: pool.reserveB },
                  ]}
                />
              </section>
              <TradesFeed pool={pool} />
            </div>
            <div className="flex flex-col gap-6">
              <PositionCard pool={pool} />
              {pool.proposal ? <FeeVote pool={pool} /> : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PoolHeader({ pool }: { pool: Pool }) {
  const { app, locale } = useAppCopy()
  const pp = app.pool
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-4">
        <PairMark a={pool.a} b={pool.b} size={40} />
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold tracking-display">
            {pool.a}/{pool.b}
            <FeeTier fee={pool.fee} className="text-sm" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t(pp.priceOf, { a: pool.a, b: pool.b, price: formatPrice(poolPrice(pool), locale) })}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <NetworkBadge name={NETWORK_NAME} variant="outline" icon={<span className="block size-full rounded-full bg-success" />} />
        <span className="inline-flex items-center gap-1 rounded-full border bg-card py-0.5 pr-0.5 pl-2.5">
          <span className="font-semibold">{pp.contract}</span>
          <WalletAddress address={pool.address} className="text-foreground" />
          <WalletCopyButton address={pool.address} copyLabel={app.wallet.copy} copiedLabel={app.wallet.copied} />
        </span>
        <span>{pool.createdByYou ? pp.createdByYou : t(pp.created, { date: formatDate(pool.createdAt, locale) })}</span>
      </div>
    </div>
  )
}

function PriceCard({ pool }: { pool: Pool }) {
  const { app, locale } = useAppCopy()
  const c = app.pool.chart
  const [range, setRange] = useState<7 | 30>(7)
  // Measure the range back from the latest point (keeps render pure).
  const latest = pool.history.length ? new Date(pool.history[pool.history.length - 1]!.t).getTime() : 0
  const since = latest - range * 24 * 3600 * 1000
  const points = pool.history.filter((p) => new Date(p.t).getTime() >= since)
  const shown = points.length >= 2 ? points : pool.history.slice(-2)
  const first = shown[0]?.p ?? 0
  const last = shown[shown.length - 1]?.p ?? 0
  const change = first > 0 ? last / first - 1 : 0

  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="price-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="price-title" className="text-lg font-extrabold">
            {c.title}
          </h2>
          <p className={cn("text-xs font-semibold tabular-nums", change >= 0 ? "text-success" : "text-destructive")}>
            {t(c.change, { pct: `${change >= 0 ? "+" : ""}${formatPercent(change, locale)}` })}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border p-1" role="group" aria-label={c.rangeLabel}>
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "inline-flex h-9 min-w-12 items-center justify-center rounded-full px-3 text-xs font-bold transition-colors",
                range === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r === 7 ? c.range7 : c.range30}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <PriceChart points={shown} locale={locale} label={t(c.label, { a: pool.a, b: pool.b })} unit={`${pool.b} / ${pool.a}`} />
      </div>
    </section>
  )
}

function TradesFeed({ pool }: { pool: Pool }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const tr = app.pool.trades
  const trades = pool.trades.slice(0, 8)
  const live = demo?.settings.liveMarket
  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="trades-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="trades-title" className="flex items-center gap-2 text-lg font-extrabold">
          {live ? <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-success" /> : null}
          {tr.title}
        </h2>
        {!live ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <PauseCircleIcon className="size-3.5" aria-hidden="true" />
            {tr.paused}
          </span>
        ) : null}
      </div>
      {trades.length ? (
        <ul className="mt-3 divide-y text-sm">
          {trades.map((x) => (
            <li key={x.id} className="fs-fade-up flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 tabular-nums">
                <span className="font-semibold">{formatAmount(x.amountIn, x.tokenIn, locale)} {x.tokenIn}</span>
                <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold">{formatAmount(x.amountOut, x.tokenOut, locale)} {x.tokenOut}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {x.you ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground">{tr.you}</span>
                ) : (
                  <span className="hidden font-mono sm:inline" title={x.trader}>
                    {shortAddress(x.trader)}
                  </span>
                )}
                <span>{formatRelative(x.at, locale)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{tr.empty}</p>
      )}
    </section>
  )
}
