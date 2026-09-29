import type { ImpactLevel } from "@/lib/demo/amm"
import { cn } from "@/lib/utils"

const tone: Record<ImpactLevel, string> = {
  low: "border-success/40 text-success",
  noticeable: "border-warning/50 text-warning",
  high: "border-destructive/50 text-destructive",
}

const dot: Record<ImpactLevel, string> = {
  low: "bg-success",
  noticeable: "bg-warning",
  high: "bg-destructive",
}

/** Price impact with its level: colour always paired with a word (green / amber / red). */
export function ImpactBadge({
  level,
  label,
  value,
  className,
}: {
  level: ImpactLevel
  label: string
  value: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs font-bold tabular-nums transition-colors duration-200",
        tone[level],
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot[level])} />
      {value}
      <span className="font-semibold">· {label}</span>
    </span>
  )
}
