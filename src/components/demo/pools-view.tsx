"use client"

import { ArrowRightIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { feeApr, poolPrice, poolTvlUsd, viewPosition } from "@/lib/demo/amm"
import { useDemo } from "@/lib/demo/store"
import { PAIRS } from "@/lib/demo/tokens"
import type { Pool } from "@/lib/demo/types"
import { formatPercent, formatPrice, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { PairMark } from "./token-mark"

export function FeeTier({ fee, className }: { fee: number; className?: string }) {
  const { locale } = useAppCopy()
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground", className)}>
      {formatPercent(fee, locale)}
    </span>
  )
}

export function PoolsView() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const p = app.pools

  if (!demo) return <PageSkeleton />

  const pools = demo.pools.filter((x) => x.lpSupply > 0)
  const tvl = pools.reduce((s, x) => s + poolTvlUsd(x), 0)
  const volume = pools.reduce((s, x) => s + x.volumeUsd24h, 0)
  const fees = pools.reduce((s, x) => s + x.feesUsd24h, 0)
  const connected = demo.wallet.status === "connected"
  const missing = PAIRS.filter((pair) => !demo.pools.some((x) => x.id === pair.id && x.lpSupply > 0))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-extrabold tracking-display">{p.title}</h1>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: p.tvl, value: formatUsd(tvl, locale, { compact: true }) },
          { label: p.volume, value: formatUsd(volume, locale, { compact: true }) },
          { label: p.fees, value: formatUsd(fees, locale) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card px-5 py-4">
            <dt className="text-sm font-semibold text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="positions-title">
        <h2 id="positions-title" className="text-xl font-bold">
          {p.yourPositions}
        </h2>
        {!connected ? (
          <p className="mt-3 rounded-2xl border border-dashed px-5 py-6 text-sm text-muted-foreground">{p.connectToSee}</p>
        ) : demo.positions.length === 0 ? (
          <div className="mt-3 flex flex-col items-start gap-3 rounded-2xl border border-dashed px-5 py-6">
            <p className="text-sm text-muted-foreground">{p.positionsEmpty}</p>
            <Link href={href(locale, "/app/pools/eth-usdc")} className="text-sm font-bold text-primary-ink underline underline-offset-4">
              {p.positionsEmptyCta}
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {demo.positions.map((pos) => {
              const pool = demo.pools.find((x) => x.id === pos.poolId)
              if (!pool) return null
              const v = viewPosition(pool, pos)
              return (
                <li key={pos.poolId}>
                  <Link
                    href={href(locale, `/app/pools/${pool.id}`)}
                    className="group flex flex-col gap-4 rounded-3xl border bg-card p-5 transition-colors hover:border-input"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <PairMark a={pool.a} b={pool.b} size={28} />
                        <span className="font-extrabold">
                          {pool.a}/{pool.b}
                        </span>
                        <FeeTier fee={pool.fee} />
                      </span>
                      <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    <span className="grid grid-cols-3 gap-3 text-sm">
                      <Stat label={app.pool.position.value} value={formatUsd(v.valueUsd, locale)} />
                      <Stat label={app.pool.position.share} value={formatPercent(v.share, locale)} />
                      <Stat label={app.pool.position.feesEarned} value={formatUsd(pos.feesUsd, locale)} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="all-pools-title">
        <h2 id="all-pools-title" className="text-xl font-bold">
          {p.allPools}
        </h2>
        {/* Desktop table */}
        <div className="mt-3 hidden overflow-hidden rounded-3xl border bg-card md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-semibold">{p.pair}</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">{p.tvl}</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">{p.volume}</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  <span className="inline-flex items-center justify-end gap-0.5">
                    {p.apr}
                    <InfoTip label={p.apr} className="-my-1 size-7">
                      {p.aprHelp}
                    </InfoTip>
                  </span>
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">{p.price}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pools.map((pool) => (
                <tr key={pool.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3.5">
                    <Link href={href(locale, `/app/pools/${pool.id}`)} className="flex items-center gap-3 font-bold underline-offset-4 hover:underline">
                      <PairMark a={pool.a} b={pool.b} size={26} />
                      {pool.a}/{pool.b}
                      <FeeTier fee={pool.fee} />
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{formatUsd(poolTvlUsd(pool), locale, { compact: true })}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{formatUsd(pool.volumeUsd24h, locale, { compact: true })}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{formatPercent(feeApr(pool), locale)}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground tabular-nums">
                    <PriceText pool={pool} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile list */}
        <ul className="mt-3 flex flex-col gap-3 md:hidden">
          {pools.map((pool) => (
            <li key={pool.id}>
              <Link href={href(locale, `/app/pools/${pool.id}`)} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <span className="flex items-center gap-3 font-bold">
                  <PairMark a={pool.a} b={pool.b} size={26} />
                  {pool.a}/{pool.b}
                  <FeeTier fee={pool.fee} />
                </span>
                <span className="grid grid-cols-3 gap-2 text-sm">
                  <Stat label={p.tvl} value={formatUsd(poolTvlUsd(pool), locale, { compact: true })} />
                  <Stat label={p.volume} value={formatUsd(pool.volumeUsd24h, locale, { compact: true })} />
                  <Stat label={p.apr} value={formatPercent(feeApr(pool), locale)} />
                </span>
                <span className="text-xs text-muted-foreground">
                  <PriceText pool={pool} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {missing.length ? (
        <section aria-labelledby="missing-title">
          <h2 id="missing-title" className="text-xl font-bold">
            {p.noPoolTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{p.noPoolBody}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {missing.map((pair) => (
              <li key={pair.id}>
                <Link
                  href={href(locale, `/app/pools/${pair.id}`)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-input px-4 text-sm font-bold transition-colors hover:bg-muted"
                >
                  <PlusIcon className="size-4 text-primary" aria-hidden="true" />
                  <PairMark a={pair.a} b={pair.b} size={20} />
                  {t(p.create, { pair: `${pair.a}/${pair.b}` })}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function PriceText({ pool }: { pool: Pool }) {
  const { app, locale } = useAppCopy()
  return <>{t(app.pool.priceOf, { a: pool.a, b: pool.b, price: formatPrice(poolPrice(pool), locale) })}</>
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10" aria-hidden="true">
      <div className="h-9 w-40 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-muted" />
    </div>
  )
}
