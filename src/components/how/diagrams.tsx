import { ArrowDownIcon, ArrowRightIcon, CoinsIcon, RefreshCwIcon, UndoDotIcon } from "lucide-react"
import { Fragment } from "react"

import { PairMark, TokenMark } from "@/components/demo/token-mark"
import type { TokenSymbol } from "@/lib/demo/types"

/** Flat line-art arrow that points right on wide screens and down on phones. */
function Connector({ label }: { label?: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center justify-center gap-1 text-primary sm:flex-row" aria-hidden="true">
      <ArrowDownIcon className="size-5 sm:hidden" strokeWidth={2} />
      <ArrowRightIcon className="hidden size-5 sm:block" strokeWidth={2} />
      {label ? <span className="text-[11px] font-bold text-muted-foreground sm:hidden">{label}</span> : null}
    </span>
  )
}

/** tWBTC → pool → tETH → pool → tUSDC. */
export function RouteDiagram({ label, fee }: { label: string; fee: string }) {
  const steps: { token: TokenSymbol; pool?: { a: TokenSymbol; b: TokenSymbol; fee: string } }[] = [
    { token: "tWBTC", pool: { a: "tWBTC", b: "tETH", fee } },
    { token: "tETH", pool: { a: "tETH", b: "tUSDC", fee } },
    { token: "tUSDC" },
  ]
  return (
    <figure aria-label={label} className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-3">
        {steps.map((s) => (
          <Fragment key={s.token}>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 font-bold">
              <TokenMark symbol={s.token} size={22} />
              {s.token}
            </span>
            {s.pool ? (
              <>
                <Connector />
                <span className="flex flex-col items-center gap-1 rounded-2xl border-2 border-primary px-4 py-2.5">
                  <PairMark a={s.pool.a} b={s.pool.b} size={20} />
                  <span className="text-xs font-bold whitespace-nowrap">
                    {s.pool.a}/{s.pool.b}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{s.pool.fee}</span>
                </span>
                <Connector />
              </>
            ) : null}
          </Fragment>
        ))}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  )
}

/** Deposit → pool → LP tokens, fees stay in the pool, burn to withdraw. */
export function LpDiagram({
  labels,
}: {
  labels: { label: string; deposit: string; pool: string; mint: string; fees: string; withdraw: string }
}) {
  return (
    <figure aria-label={labels.label} className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-background p-4 text-center">
          <PairMark a="tETH" b="tUSDC" size={28} />
          <p className="text-sm font-bold">{labels.deposit}</p>
        </div>
        <Connector />
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-primary p-4 text-center">
          <span className="text-sm font-extrabold">{labels.pool}</span>
          <span className="text-xs font-semibold text-muted-foreground">x · y = k</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCwIcon className="size-3.5 text-primary" aria-hidden="true" />
            {labels.fees}
          </span>
        </div>
        <Connector />
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-background p-4 text-center">
          <CoinsIcon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm font-bold">{labels.mint}</p>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <UndoDotIcon className="size-4 text-primary" aria-hidden="true" />
        {labels.withdraw}
      </p>
      <figcaption className="sr-only">{labels.label}</figcaption>
    </figure>
  )
}
