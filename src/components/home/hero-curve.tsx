"use client"

import { PauseIcon, PlayIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { ImpactBadge } from "@/components/demo/impact-badge"
import { TokenMark } from "@/components/demo/token-mark"
import { CurveChart } from "@/components/diagrams/curve-chart"
import { TokenAmount } from "@/components/ui/token-amount"
import { useTween } from "@/hooks/use-tween"
import { intlLocale, type Locale } from "@/i18n/config"
import { getAmountOut, impactLevel } from "@/lib/demo/amm"
import { toBaseUnits, TOKENS } from "@/lib/demo/tokens"
import { formatPercent } from "@/lib/format"

// The seeded tETH/tUSDC pool.
const X0 = 420
const Y0 = 1_344_000
const FEE = 0.003
const STEPS = [1, 15, 120]

export interface HeroCurveLabels {
  label: string
  caption: string
  pay: string
  receive: string
  impact: string
  min: string
  now: string
  after: string
  axisX: string
  axisY: string
  levels: { low: string; noticeable: string; high: string }
  pause: string
  play: string
}

/** The home hero: a live quote whose trade slides along the pool's curve, three sizes in a loop. */
export function HeroCurve({ labels, locale }: { labels: HeroCurveLabels; locale: Locale }) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3400)
    return () => window.clearInterval(id)
  }, [playing])

  const amountIn = STEPS[step]!
  const out = getAmountOut(amountIn, X0, Y0, FEE)
  const impact = 1 - out / (amountIn * (Y0 / X0) * (1 - FEE))
  const level = impactLevel(impact)
  const x1 = useTween(X0 + amountIn, 700)
  const nf = intlLocale[locale]

  return (
    <div className="relative rounded-3xl border bg-card p-4 sm:p-6" aria-label={labels.label} role="group">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow text-muted-foreground">{labels.caption}</p>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? labels.pause : labels.play}
          title={playing ? labels.pause : labels.play}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {playing ? <PauseIcon className="size-4" aria-hidden="true" /> : <PlayIcon className="size-4" aria-hidden="true" />}
        </button>
      </div>

      <CurveChart
        x0={X0}
        y0={Y0}
        x1={x1}
        span={2.1}
        showLegend={false}
        className="mt-2"
        labels={{ title: labels.label, axisIn: labels.axisX, axisOut: labels.axisY, now: labels.now, after: labels.after }}
      />

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm" aria-live="polite">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold text-muted-foreground">{labels.pay}</dt>
          <dd className="flex items-center gap-2 text-base font-bold">
            <TokenMark symbol="tETH" size={20} />
            <TokenAmount value={toBaseUnits(amountIn, "tETH")} decimals={TOKENS.tETH.decimals} symbol="tETH" fractionDigits={2} locale={nf} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold text-muted-foreground">{labels.receive}</dt>
          <dd className="flex items-center gap-2 text-base font-bold">
            <TokenMark symbol="tUSDC" size={20} />
            <TokenAmount value={toBaseUnits(out, "tUSDC")} decimals={TOKENS.tUSDC.decimals} symbol="tUSDC" fractionDigits={2} locale={nf} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold text-muted-foreground">{labels.impact}</dt>
          <dd>
            <ImpactBadge level={level} label={labels.levels[level]} value={formatPercent(impact, locale)} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold text-muted-foreground">{labels.min}</dt>
          <dd className="text-sm font-semibold">
            <TokenAmount value={toBaseUnits(out * 0.995, "tUSDC")} decimals={TOKENS.tUSDC.decimals} symbol="tUSDC" fractionDigits={2} locale={nf} />
          </dd>
        </div>
      </dl>
    </div>
  )
}
