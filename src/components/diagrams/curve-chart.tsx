import { cn } from "@/lib/utils"

/**
 * The constant-product curve x · y = k, drawn flat in SVG.
 * x is the reserve of the token you pay in, y the reserve of the token you take out,
 * so every trade moves the point right and down along the curve.
 *
 * Presentational only: parents tween `x1` to animate the point.
 */
export interface CurveChartProps {
  /** Reserves now: token in (x) and token out (y). */
  x0: number
  y0: number
  /** Reserve of the token in after the trade; omitted or equal to x0 means no trade yet. */
  x1?: number
  labels: {
    title: string
    axisIn: string
    axisOut: string
    now: string
    after: string
    spot?: string
    execution?: string
    deltaIn?: string
    deltaOut?: string
  }
  /** Fixed domain multiplier so typing doesn't rescale the chart. */
  span?: number
  className?: string
  showLegend?: boolean
}

const W = 360
const H = 240
const PAD = { l: 12, r: 16, t: 20, b: 34 }

export function CurveChart({ x0, y0, x1, labels, span = 2.4, className, showLegend = true }: CurveChartProps) {
  const k = x0 * y0
  const hasTrade = x1 !== undefined && x1 > x0 * 1.000001
  const xAfter = hasTrade ? x1! : x0
  const xmin = x0 * 0.32
  const xmax = Math.max(x0 * span, xAfter * 1.12)
  const ymax = k / xmin
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const sx = (x: number) => PAD.l + ((x - xmin) / (xmax - xmin)) * iw
  const sy = (y: number) => PAD.t + ih - (y / ymax) * ih

  const path = (from: number, to: number, n: number) => {
    let d = ""
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n
      d += `${i ? "L" : "M"}${sx(x).toFixed(2)},${sy(k / x).toFixed(2)}`
    }
    return d
  }

  const yAfter = k / xAfter
  const nx = sx(x0)
  const ny = sy(y0)
  const ax = sx(xAfter)
  const ay = sy(yAfter)
  // Tangent (spot price) through the current point.
  const slope = -y0 / x0
  const tx1 = x0 - x0 * 0.5
  const tx2 = x0 + x0 * 0.75
  const baseY = PAD.t + ih

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.title} className="h-auto w-full overflow-visible">
        <title>{labels.title}</title>
        {/* Axes */}
        <line x1={PAD.l} y1={baseY} x2={W - PAD.r} y2={baseY} stroke="var(--border)" strokeWidth={1.5} />
        <line x1={PAD.l} y1={PAD.t - 8} x2={PAD.l} y2={baseY} stroke="var(--border)" strokeWidth={1.5} />
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-muted-foreground text-[11px] font-semibold">
          {labels.axisIn} →
        </text>
        <text x={PAD.l + 6} y={PAD.t - 6} className="fill-muted-foreground text-[11px] font-semibold">
          ↑ {labels.axisOut}
        </text>

        {/* The whole curve */}
        <path d={path(xmin, xmax, 90)} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.55} strokeWidth={1.5} />

        {/* Spot price: tangent at the current point */}
        <line
          x1={sx(tx1)}
          y1={sy(y0 + slope * (tx1 - x0))}
          x2={sx(tx2)}
          y2={sy(y0 + slope * (tx2 - x0))}
          stroke="var(--muted-foreground)"
          strokeWidth={1.25}
          strokeDasharray="3 5"
          strokeLinecap="round"
        />

        {hasTrade ? (
          <g>
            {/* Projections onto the axes: what goes in, what comes out */}
            <line x1={nx} y1={ny} x2={nx} y2={baseY} stroke="var(--border)" strokeDasharray="2 4" />
            <line x1={ax} y1={ay} x2={ax} y2={baseY} stroke="var(--border)" strokeDasharray="2 4" />
            <line x1={PAD.l} y1={ny} x2={nx} y2={ny} stroke="var(--border)" strokeDasharray="2 4" />
            <line x1={PAD.l} y1={ay} x2={ax} y2={ay} stroke="var(--border)" strokeDasharray="2 4" />
            <line x1={nx} y1={baseY} x2={ax} y2={baseY} stroke="var(--primary)" strokeWidth={4} strokeLinecap="round" />
            <line x1={PAD.l} y1={ny} x2={PAD.l} y2={ay} stroke="var(--chart-3)" strokeWidth={4} strokeLinecap="round" />
            {labels.deltaIn && ax - nx > 26 ? (
              <text x={(nx + ax) / 2} y={baseY + 16} textAnchor="middle" className="fill-primary-ink text-[11px] font-bold">
                {labels.deltaIn}
              </text>
            ) : null}
            {labels.deltaOut && ay - ny > 18 ? (
              <text x={PAD.l + 8} y={(ny + ay) / 2 + 4} className="fill-foreground text-[11px] font-bold">
                {labels.deltaOut}
              </text>
            ) : null}
            {/* Your average price: the chord */}
            <line x1={nx} y1={ny} x2={ax} y2={ay} stroke="var(--foreground)" strokeWidth={1.5} />
            {/* The stretch of curve your trade travels */}
            <path d={path(x0, xAfter, 30)} fill="none" stroke="var(--primary)" strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : null}

        <circle cx={nx} cy={ny} r={5.5} fill="var(--foreground)" stroke="var(--card)" strokeWidth={2} />
        <text x={nx - 10} y={ny - 10} textAnchor="end" className="fill-foreground text-[12px] font-bold">
          {labels.now}
        </text>
        {hasTrade ? (
          <>
            <circle cx={ax} cy={ay} r={7} fill="var(--primary)" stroke="var(--card)" strokeWidth={2.5} />
            <text x={Math.min(ax + 10, W - PAD.r - 4)} y={ay + 20} textAnchor={ax > W - 90 ? "end" : "start"} className="fill-foreground text-[12px] font-bold">
              {labels.after}
            </text>
          </>
        ) : null}
      </svg>
      {showLegend && (labels.spot || labels.execution) ? (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {labels.spot ? (
            <span className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden="true">
                <line x1="1" y1="3" x2="17" y2="3" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
              {labels.spot}
            </span>
          ) : null}
          {labels.execution ? (
            <span className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden="true">
                <line x1="1" y1="3" x2="17" y2="3" stroke="var(--foreground)" strokeWidth="1.5" />
              </svg>
              {labels.execution}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            {labels.after}
          </span>
        </figcaption>
      ) : null}
    </figure>
  )
}
