"use client"

import { useState } from "react"

import { PairMark } from "@/components/demo/token-mark"
import { ImpactBadge } from "@/components/demo/impact-badge"
import { Slider } from "@/components/ui/slider"
import { TokenAmount } from "@/components/ui/token-amount"
import { t } from "@/i18n/t"
import { intlLocale, type Locale } from "@/i18n/config"
import { getAmountOut, impactLevel } from "@/lib/demo/amm"
import { toBaseUnits, TOKENS } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { formatPercent, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

// The two seeded pools, seen from the tUSDC side.
const POOLS: { key: "deep" | "thin"; a: TokenSymbol; out: TokenSymbol; rIn: number; rOut: number; fee: number; tvl: number }[] = [
  { key: "deep", a: "tETH", out: "tETH", rIn: 1_344_000, rOut: 420, fee: 0.003, tvl: 2_688_000 },
  { key: "thin", a: "tLINK", out: "tLINK", rIn: 34_800, rOut: 2_400, fee: 0.01, tvl: 69_600 },
]

export interface TwoPoolsLabels {
  spend: string
  deep: string
  thin: string
  deepPair: string
  thinPair: string
  impact: string
  receive: string
  worth: string
  note: string
  sliderLabel: string
  levels: { low: string; noticeable: string; high: string }
}

/** "Same trade, two pools": one slider, the deep and the thin pool side by side. */
export function TwoPools({ labels, locale }: { labels: TwoPoolsLabels; locale: Locale }) {
  const [amount, setAmount] = useState(5000)
  const nf = intlLocale[locale]
  const amountText = new Intl.NumberFormat(nf).format(amount)

  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{labels.spend}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-display tabular-nums sm:text-4xl">
            {amountText} <span className="text-lg font-bold text-muted-foreground">tUSDC</span>
          </p>
        </div>
      </div>
      <Slider
        className="mt-3"
        min={100}
        max={20000}
        step={100}
        value={[amount]}
        onValueChange={(v) => setAmount(v[0] ?? 100)}
        thumbLabel={labels.sliderLabel}
        valueText={`${amountText} tUSDC`}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {POOLS.map((p) => {
          const out = getAmountOut(amount, p.rIn, p.rOut, p.fee)
          const inWithFee = amount * (1 - p.fee)
          const impact = inWithFee / (p.rIn + inWithFee)
          const level = impactLevel(impact)
          const width = Math.min(100, (impact / 0.4) * 100)
          return (
            <section key={p.key} aria-label={p.key === "deep" ? labels.deep : labels.thin} className="rounded-2xl border p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <PairMark a={p.a} b="tUSDC" size={26} />
                <div className="min-w-0">
                  <p className="font-extrabold">{p.key === "deep" ? labels.deep : labels.thin}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(p.key === "deep" ? labels.deepPair : labels.thinPair, { tvl: formatUsd(p.tvl, locale, { compact: true }) })}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-muted-foreground">{labels.impact}</span>
                <ImpactBadge level={level} label={labels.levels[level]} value={formatPercent(impact, locale)} />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width,background-color] duration-200 ease-out",
                    level === "low" ? "bg-success" : level === "noticeable" ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${Math.max(width, 1.5)}%` }}
                />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">{labels.receive}</span>
                <span className="text-right">
                  <TokenAmount
                    value={toBaseUnits(out, p.out)}
                    decimals={TOKENS[p.out].decimals}
                    symbol={p.out}
                    fractionDigits={p.out === "tETH" ? 4 : 2}
                    locale={nf}
                    className="text-lg font-bold"
                  />
                  <span className="block text-xs text-muted-foreground">{t(labels.worth, { usd: formatUsd(out * TOKENS[p.out].usd, locale) })}</span>
                </span>
              </div>
            </section>
          )
        })}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{labels.note}</p>
    </div>
  )
}
