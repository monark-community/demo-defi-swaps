"use client"

import { useTween } from "@/hooks/use-tween"
import type { Locale } from "@/i18n/config"
import type { TokenSymbol } from "@/lib/demo/types"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

import { TokenMark } from "../demo/token-mark"

interface Tank {
  symbol: TokenSymbol
  now: number
  after: number
}

/**
 * The pool's two reserves as horizontal "tanks". While a trade is previewed or
 * pending, the token you pay in fills and the token you take out drains.
 */
export function ReserveBars({
  tanks,
  locale,
  label,
  active,
  className,
}: {
  tanks: [Tank, Tank]
  locale: Locale
  label: string
  /** Pending: animate towards `after` and mark the change. */
  active?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="group" aria-label={label}>
      {tanks.map((t, i) => (
        <TankRow key={`${t.symbol}-${i}`} tank={t} locale={locale} active={active} filling={i === 0} />
      ))}
    </div>
  )
}

function TankRow({ tank, locale, active, filling }: { tank: Tank; locale: Locale; active?: boolean; filling: boolean }) {
  const max = Math.max(tank.now, tank.after) * 1.04 || 1
  const nowPct = (tank.now / max) * 100
  const target = active ? (tank.after / max) * 100 : nowPct
  const pct = useTween(target, active ? 900 : 250)
  const changed = Math.abs(tank.after - tank.now) > tank.now * 1e-9
  const delta = tank.after - tank.now

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
      <TokenMark symbol={tank.symbol} size={22} />
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-bold">{tank.symbol}</span>
        <span className="truncate font-mono text-xs tabular-nums text-muted-foreground">
          {formatAmount(active ? tank.after : tank.now, tank.symbol, locale, tank.now >= 1000 ? 0 : 2)}
          {changed ? (
            <span className={cn("ml-1.5 font-bold", filling ? "text-primary-ink" : "text-foreground")}>
              {delta > 0 ? "+" : "−"}
              {formatAmount(Math.abs(delta), tank.symbol, locale, Math.abs(delta) >= 1000 ? 0 : Math.abs(delta) >= 1 ? 2 : 4)}
            </span>
          ) : null}
        </span>
      </div>
      <span />
      <div className="relative h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full bg-chart-3/70" style={{ width: `${Math.min(pct, nowPct)}%` }} />
        {changed ? (
          filling ? (
            <div
              className="absolute inset-y-0 rounded-r-full bg-primary"
              style={{ left: `${nowPct}%`, width: `${Math.max(0, (active ? pct : (tank.after / max) * 100) - nowPct)}%` }}
            />
          ) : (
            <div
              className="fs-hatch absolute inset-y-0"
              style={{ left: `${active ? pct : (tank.after / max) * 100}%`, width: `${Math.max(0, nowPct - (active ? pct : (tank.after / max) * 100))}%` }}
            />
          )
        ) : null}
      </div>
    </div>
  )
}
