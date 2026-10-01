"use client"

import { useState } from "react"

import { ImpactBadge } from "@/components/demo/impact-badge"
import { CurveChart } from "@/components/diagrams/curve-chart"
import { Slider } from "@/components/ui/slider"
import { useTween } from "@/hooks/use-tween"
import type { Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { impactLevel } from "@/lib/demo/amm"
import { formatAmount, formatPercent, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

const DEPTHS = {
  deep: { x: 420, y: 1_344_000 },
  thin: { x: 42, y: 134_400 },
}

// Slider position 0–100 mapped to 0.5–200 tETH on a log scale.
const toAmount = (s: number) => Math.round(0.5 * Math.pow(400, s / 100) * 100) / 100

export interface ExplorerLabels {
  label: string
  size: string
  depth: string
  deep: string
  thin: string
  spot: string
  average: string
  impact: string
  receive: string
  reserves: string
  per: string
  note: string
  now: string
  after: string
  axisIn: string
  axisOut: string
  levels: { low: string; noticeable: string; high: string }
}

/** Drag a trade along x · y = k (fee left out to isolate the curve). */
export function CurveExplorer({ labels, locale }: { labels: ExplorerLabels; locale: Locale }) {
  const [pos, setPos] = useState(45)
  const [depth, setDepth] = useState<"deep" | "thin">("deep")
  const { x, y } = DEPTHS[depth]
  const amount = toAmount(pos)
  const out = (amount * y) / (x + amount)
  const impact = amount / (x + amount)
  const level = impactLevel(impact)
  const x1 = useTween(x + amount, 200)
  const amountText = `${formatAmount(amount, "tETH", locale, 2)} tETH`

  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-start">
        <CurveChart
          key={depth}
          x0={x}
          y0={y}
          x1={x1}
          span={2.2}
          labels={{
            title: labels.label,
            axisIn: labels.axisIn,
            axisOut: labels.axisOut,
            now: labels.now,
            after: labels.after,
            spot: labels.spot,
            execution: labels.average,
          }}
        />
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-bold">{labels.size}</p>
              <p className="text-xl font-extrabold tabular-nums">{amountText}</p>
            </div>
            <Slider min={0} max={100} step={1} value={[pos]} onValueChange={(v) => setPos(v[0] ?? 0)} thumbLabel={labels.size} valueText={amountText} />
          </div>
          <div>
            <p className="text-sm font-bold" id="depth-label">
              {labels.depth}
            </p>
            <div className="mt-2 inline-flex gap-1 rounded-full border p-1" role="group" aria-labelledby="depth-label">
              {(["deep", "thin"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={depth === d}
                  onClick={() => setDepth(d)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors",
                    depth === d ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {labels[d]} · {formatAmount(DEPTHS[d].x, "tETH", locale, 0)} tETH
                </button>
              ))}
            </div>
          </div>
          <dl className="flex flex-col gap-2.5 rounded-2xl border px-4 py-3 text-sm" aria-live="polite">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.spot}</dt>
              <dd className="font-semibold tabular-nums">{t(labels.per, { price: formatPrice(y / x, locale) })}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.average}</dt>
              <dd className="font-semibold tabular-nums">{t(labels.per, { price: formatPrice(out / amount, locale) })}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{labels.impact}</dt>
              <dd>
                <ImpactBadge level={level} label={labels.levels[level]} value={formatPercent(impact, locale)} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.receive}</dt>
              <dd className="font-bold tabular-nums">{formatAmount(out, "tUSDC", locale, 2)} tUSDC</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.reserves}</dt>
              <dd className="text-right tabular-nums text-muted-foreground">
                {formatAmount(x + amount, "tETH", locale, 2)} tETH · {formatAmount(y - out, "tUSDC", locale, 0)} tUSDC
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">{labels.note}</p>
        </div>
      </div>
    </div>
  )
}
