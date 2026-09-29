"use client"

import { ArrowUpDownIcon, DropletIcon, MinusIcon, PlusIcon, SparklesIcon, VoteIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { TxStatus } from "@/components/ui/tx-status"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useDemo } from "@/lib/demo/store"
import { pairById } from "@/lib/demo/tokens"
import type { ActivityEntry, ActivityKind } from "@/lib/demo/types"
import { formatDateTime, formatPercent, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { ConnectButton } from "./connect-button"
import { PageSkeleton } from "./pools-view"
import { PairMark } from "./token-mark"

type Filter = "all" | "swaps" | "liquidity" | "votes" | "failed"

/** History rows shown at a time. */
const PAGE = 5

const KIND_ICONS: Record<ActivityKind, typeof PlusIcon> = {
  swap: ArrowUpDownIcon,
  add: PlusIcon,
  remove: MinusIcon,
  create: SparklesIcon,
  vote: VoteIcon,
  faucet: DropletIcon,
}

function matches(a: ActivityEntry, f: Filter) {
  if (f === "all") return true
  if (f === "failed") return a.status === "failed"
  if (f === "swaps") return a.kind === "swap"
  if (f === "liquidity") return a.kind === "add" || a.kind === "remove" || a.kind === "create"
  return a.kind === "vote"
}

export function ActivityView() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const ac = app.activity
  const [filter, setFilter] = useState<Filter>("all")
  const [shown, setShown] = useState(PAGE)

  if (!demo) return <PageSkeleton />
  const connected = demo.wallet.status === "connected"

  const confirmedSwaps = demo.activity.filter((a) => a.kind === "swap" && a.status === "confirmed")
  const volume = confirmedSwaps.reduce((s, a) => s + (a.usd ?? 0), 0)
  const feesPaid = confirmedSwaps.reduce((s, a) => s + (a.feeUsd ?? 0), 0)
  const lpFees = demo.positions.reduce((s, p) => s + p.feesUsd, 0)
  const pools = demo.pools.filter((p) => p.lpSupply > 0).sort((x, y) => y.volumeUsd24h - x.volumeUsd24h)
  const maxVol = Math.max(1, ...pools.map((p) => p.volumeUsd24h))
  const items = demo.activity.filter((a) => matches(a, filter))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="text-3xl font-extrabold tracking-display">{ac.title}</h1>

      {!connected ? (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed p-6">
          <p className="text-muted-foreground">{ac.connect}</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: ac.stats.swaps, value: String(confirmedSwaps.length) },
              { label: ac.stats.volume, value: formatUsd(volume, locale) },
              { label: ac.stats.feesPaid, value: formatUsd(feesPaid, locale) },
              { label: ac.stats.lpFees, value: formatUsd(lpFees, locale) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card px-4 py-4 sm:px-5">
                <dt className="text-xs font-semibold text-muted-foreground sm:text-sm">{s.label}</dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums sm:text-2xl">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="history-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="history-title" className="text-lg font-extrabold">
                  {ac.history}
                </h2>
                <div role="group" aria-label={ac.filters.label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                  {(["all", "swaps", "liquidity", "votes", "failed"] as Filter[]).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? "default" : "outline"}
                      aria-pressed={filter === f}
                      onClick={() => {
                        setFilter(f)
                        setShown(PAGE)
                      }}
                      className="shrink-0"
                    >
                      {ac.filters[f]}
                    </Button>
                  ))}
                </div>
              </div>
              {items.length ? (
                <>
                  <ul className="mt-4 divide-y">
                    {items.slice(0, shown).map((a) => (
                      <HistoryRow key={a.id} entry={a} />
                    ))}
                  </ul>
                  {items.length > shown ? (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setShown((n) => n + PAGE)}>
                      {ac.showMore}
                    </Button>
                  ) : null}
                </>
              ) : (
                <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5">
                  <p className="text-sm text-muted-foreground">{demo.activity.length ? ac.emptyFiltered : ac.empty}</p>
                  {!demo.activity.length ? (
                    <Button asChild size="sm">
                      <Link href={href(locale, "/app")}>{ac.emptyCta}</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="volume-title">
              <h2 id="volume-title" className="text-lg font-extrabold">
                {ac.volumeTitle}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{ac.volumeHint}</p>
              <ul className="mt-4 flex flex-col gap-4">
                {pools.map((p) => (
                  <li key={p.id}>
                    <Link href={href(locale, `/app/pools/${p.id}`)} className="group flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-bold group-hover:underline group-hover:underline-offset-4">
                          <PairMark a={p.a} b={p.b} size={20} />
                          {p.a}/{p.b}
                        </span>
                        <span className="tabular-nums text-muted-foreground">{formatUsd(p.volumeUsd24h, locale, { compact: true })}</span>
                      </span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <span className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(1.5, (p.volumeUsd24h / maxVol) * 100)}%` }} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function HistoryRow({ entry: a }: { entry: ActivityEntry }) {
  const { app, locale } = useAppCopy()
  const ac = app.activity
  const Icon = KIND_ICONS[a.kind]
  const pair = a.poolId ? pairById(a.poolId) : null
  const pairText = pair ? `${pair.a}/${pair.b}` : ""

  let line = ""
  if (a.kind === "swap" && a.tokenIn && a.tokenOut) {
    line = t(ac.lines.swap, { in: formatToken(a.amountIn ?? 0, a.tokenIn, locale), out: formatToken(a.amountOut ?? 0, a.tokenOut, locale) })
  } else if ((a.kind === "add" || a.kind === "remove" || a.kind === "create") && pair) {
    line = t(ac.lines.liquidity, { a: formatToken(a.amountA ?? 0, pair.a, locale), b: formatToken(a.amountB ?? 0, pair.b, locale), pair: pairText })
  } else if (a.kind === "vote" && a.vote) {
    const choice = app.pool.vote.choice[a.vote]
    line = t(ac.lines.vote, { choice: choice.charAt(0).toUpperCase() + choice.slice(1), pair: pairText })
  } else if (a.kind === "faucet") {
    line = ac.lines.faucet
  }

  const error =
    a.status === "failed"
      ? a.error === "slippage"
        ? t(ac.errors.slippage, { move: formatPercent(a.move ?? 0, locale), tolerance: formatPercent((a.toleranceBps ?? 50) / 10_000, locale) })
        : a.error === "rejected"
          ? ac.errors.rejected
          : ac.errors.reverted
      : null

  return (
    <li className="flex gap-3 py-3.5">
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border",
          a.status === "failed" ? "border-destructive/40 text-destructive" : "text-primary"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="font-bold">{ac.kinds[a.kind]}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(a.at, locale)}</p>
        </div>
        {line ? <p className="text-sm tabular-nums">{line}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {a.hash ? (
            <TxStatus status={a.status === "confirmed" ? "confirmed" : "failed"} hash={a.hash} label={ac.status[a.status]} className="py-1" />
          ) : (
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-destructive">{ac.status[a.status]}</span>
          )}
          {a.usd && a.status === "confirmed" ? <span className="text-xs text-muted-foreground tabular-nums">{formatUsd(a.usd, locale)}</span> : null}
        </div>
      </div>
    </li>
  )
}
