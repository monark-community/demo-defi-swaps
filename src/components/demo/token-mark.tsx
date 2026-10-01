import { TOKENS } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

/** A flat lettered disc for a test token. Not a real logo, on purpose. */
export function TokenMark({ symbol, size = 24, className }: { symbol: TokenSymbol; size?: number; className?: string }) {
  const t = TOKENS[symbol]
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ring-2 ring-card", className)}
      style={{ width: size, height: size, backgroundColor: t.color, fontSize: Math.round(size * 0.46) }}
    >
      {t.letter}
    </span>
  )
}

/** Two overlapping discs for a pool's pair. */
export function PairMark({ a, b, size = 24, className }: { a: TokenSymbol; b: TokenSymbol; size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center", className)}>
      <TokenMark symbol={a} size={size} />
      <TokenMark symbol={b} size={size} className="-ml-2" />
    </span>
  )
}
