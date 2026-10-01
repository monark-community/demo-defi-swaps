"use client"

import { useMemo, useRef, useState } from "react"

import type { Locale } from "@/i18n/config"
import type { PricePoint } from "@/lib/demo/types"
import { formatDateTime, formatPrice, formatShortDate } from "@/lib/format"

const W = 640
const H = 220
const PAD = { l: 8, r: 8, t: 12, b: 26 }

/** A flat line-and-area price chart with a hover readout. */
export function PriceChart({
  points,
  locale,
  label,
  unit,
}: {
  points: PricePoint[]
  locale: Locale
  label: string
  unit: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const model = useMemo(() => {
    if (points.length < 2) return null
    const ts = points.map((p) => new Date(p.t).getTime())
    const t0 = ts[0]!
    const t1 = ts[ts.length - 1]!
    const ps = points.map((p) => p.p)
    let lo = Math.min(...ps)
    let hi = Math.max(...ps)
    const pad = (hi - lo) * 0.12 || hi * 0.01
    lo -= pad
    hi += pad
    const sx = (t: number) => PAD.l + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.l - PAD.r)
    const sy = (p: number) => PAD.t + (1 - (p - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b)
    const xy = points.map((p, i) => [sx(ts[i]!), sy(p.p)] as const)
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")
    const area = `${line}L${xy[xy.length - 1]![0].toFixed(1)},${H - PAD.b}L${xy[0]![0].toFixed(1)},${H - PAD.b}Z`
    const ticks = [0, 0.5, 1].map((f) => {
      const tt = t0 + (t1 - t0) * f
      return { x: sx(tt), label: formatShortDate(new Date(tt).toISOString(), locale), anchor: f === 0 ? "start" : f === 1 ? "end" : "middle" }
    })
    return { xy, line, area, ticks, lo: Math.min(...ps), hi: Math.max(...ps) }
  }, [points, locale])

  if (!model) return <div className="h-48 rounded-2xl bg-muted" aria-hidden="true" />

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    let bestD = Infinity
    model.xy.forEach(([px], i) => {
      const d = Math.abs(px - x)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setHover(best)
  }

  const h = hover !== null ? points[hover] : null
  const hxy = hover !== null ? model.xy[hover] : null
  const last = points[points.length - 1]!

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex min-h-10 items-baseline justify-between gap-3">
        <p className="text-2xl font-extrabold tabular-nums">
          {formatPrice((h ?? last).p, locale)} <span className="text-sm font-bold text-muted-foreground">{unit}</span>
        </p>
        <p className="text-xs text-muted-foreground">{formatDateTime((h ?? last).t, locale)}</p>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        className="h-auto w-full touch-pan-y"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <title>{label}</title>
        <path d={model.area} fill="var(--primary)" fillOpacity={0.08} />
        <path d={model.line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
        {model.ticks.map((tk) => (
          <text key={tk.x} x={tk.x} y={H - 8} textAnchor={tk.anchor as "start" | "middle" | "end"} className="fill-muted-foreground text-[11px]">
            {tk.label}
          </text>
        ))}
        {hxy ? (
          <g aria-hidden="true">
            <line x1={hxy[0]} y1={PAD.t} x2={hxy[0]} y2={H - PAD.b} stroke="var(--muted-foreground)" strokeDasharray="3 4" />
            <circle cx={hxy[0]} cy={hxy[1]} r={5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
          </g>
        ) : (
          <circle cx={model.xy[model.xy.length - 1]![0]} cy={model.xy[model.xy.length - 1]![1]} r={4.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
        )}
      </svg>
    </figure>
  )
}
