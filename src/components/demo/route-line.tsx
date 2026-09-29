import { ChevronRightIcon } from "lucide-react"
import { Fragment } from "react"

import type { TokenSymbol } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { TokenMark } from "./token-mark"

/** tWBTC › tETH › tUSDC, with each pool's fee under the arrow. */
export function RouteLine({ tokens, fees, className }: { tokens: TokenSymbol[]; fees?: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center justify-end gap-x-1 gap-y-1", className)}>
      {tokens.map((tok, i) => (
        <Fragment key={`${tok}-${i}`}>
          {i > 0 ? (
            <span className="inline-flex flex-col items-center px-0.5 text-muted-foreground">
              <ChevronRightIcon className="size-3.5" aria-hidden="true" />
              {fees?.[i - 1] ? <span className="text-[10px] leading-none font-semibold">{fees[i - 1]}</span> : null}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 font-semibold">
            <TokenMark symbol={tok} size={16} className="ring-1" />
            {tok}
          </span>
        </Fragment>
      ))}
    </span>
  )
}
