"use client"

import { ArrowRightIcon, CircleHelpIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"

import { CurveChart } from "@/components/diagrams/curve-chart"
import { ReserveBars } from "@/components/diagrams/reserve-bars"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InfoTip } from "@/components/ui/info-tip"
import { Input } from "@/components/ui/input"
import { SwapForm } from "@/components/ui/swap-form"
import { TokenAmount } from "@/components/ui/token-amount"
import { TxStatus } from "@/components/ui/tx-status"
import { useTween } from "@/hooks/use-tween"
import { href, intlLocale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { bestQuote, impactLevel, type Quote } from "@/lib/demo/amm"
import { useTx } from "@/lib/demo/chain"
import { logFailure, settleSwap } from "@/lib/demo/ops"
import { setSettings, useDemo } from "@/lib/demo/store"
import { parseAmount, toBaseUnits, toInputString, TOKENS, TOKEN_LIST } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { connectWallet } from "@/lib/demo/wallet"
import { formatPercent, formatPrice, formatRelative, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { ImpactBadge } from "./impact-badge"
import { RouteLine } from "./route-line"
import { TokenMark } from "./token-mark"
import { TxFeedback } from "./tx-feedback"

const SLIPPAGE_PRESETS = [10, 50, 100]

export function SwapView() {
  const demo = useDemo()
  const { app, locale, tokens: tokenNames } = useAppCopy()
  const s = app.swap
  const nf = intlLocale[locale]

  const [tokenIn, setTokenIn] = useState<TokenSymbol>("tETH")
  const [tokenOut, setTokenOut] = useState<TokenSymbol>("tUSDC")
  const [input, setInput] = useState("")
  const [ackKey, setAckKey] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hopIndex, setHopIndex] = useState(0)
  const [frozen, setFrozen] = useState<Quote | null>(null)
  const [receipt, setReceipt] = useState<string | null>(null)
  const tx = useTx()

  const slippageBps = demo?.settings.slippageBps ?? 50
  const connected = demo?.wallet.status === "connected"
  const parsed = parseAmount(input)
  const invalid = input.trim() !== "" && parsed === null
  const amount = parsed ?? 0

  const liveQuote = useMemo(
    () => (demo ? bestQuote(demo.pools, tokenIn, tokenOut, amount, slippageBps) : null),
    [demo, tokenIn, tokenOut, amount, slippageBps]
  )
  const pending = tx.state.phase === "signing" || tx.state.phase === "pending"
  const quote = pending && frozen ? frozen : liveQuote
  const hasAmount = amount > 0 && !!quote
  const level = impactLevel(quote?.impact ?? 0)
  const key = `${tokenIn}>${tokenOut}:${amount}`
  const acked = ackKey === key
  const balanceIn = demo?.balances[tokenIn] ?? 0
  const insufficient = connected && amount > balanceIn + 1e-12
  const hop = quote?.hops[Math.min(hopIndex, (quote?.hops.length ?? 1) - 1)]

  const tokenOptions = TOKEN_LIST.map((sym) => ({ symbol: sym, name: tokenNames[sym], icon: <TokenMark symbol={sym} size={20} /> }))

  const chooseIn = (v: string) => {
    const sym = v as TokenSymbol
    if (sym === tokenOut) setTokenOut(tokenIn)
    setTokenIn(sym)
    setHopIndex(0)
  }
  const chooseOut = (v: string) => {
    const sym = v as TokenSymbol
    if (sym === tokenIn) setTokenIn(tokenOut)
    setTokenOut(sym)
    setHopIndex(0)
  }
  const reverse = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    if (quote && quote.amountOut > 0) setInput(toInputString(quote.amountOut, tokenOut))
    setHopIndex(0)
  }

  let status: "idle" | "ready" | "confirming" = "idle"
  let label: string = s.buttons.enter
  if (pending) {
    status = "confirming"
    label = s.buttons.swapping
  } else if (!connected) {
    status = "ready"
    label = s.buttons.connect
  } else if (tokenIn === tokenOut) label = s.buttons.same
  else if (!quote) label = s.buttons.noRoute
  else if (!hasAmount) label = s.buttons.enter
  else if (insufficient) label = t(s.buttons.insufficient, { symbol: tokenIn })
  else if (level === "high" && !acked) label = s.buttons.ack
  else {
    status = "ready"
    label = s.buttons.swap
  }

  const swap = async () => {
    if (!connected) {
      void connectWallet({
        title: app.wallet.signIn,
        rows: [{ label: app.wallet.signInRow, value: app.wallet.signInValue }],
        movesValue: false,
        noFee: true,
      })
      return
    }
    if (!quote || !hasAmount) return
    const q = quote
    setFrozen(q)
    setReceipt(null)
    const inText = formatToken(q.amountIn, q.tokenIn, locale)
    const outText = formatToken(q.amountOut, q.tokenOut, locale)
    const ok = await tx.run(
      {
        title: t(s.summaryTitle, { in: inText, out: q.tokenOut }),
        rows: [
          { label: s.rowPay, value: inText },
          { label: s.rowReceive, value: outText },
          { label: s.rowMin, value: formatToken(q.minReceived, q.tokenOut, locale) },
          { label: s.rowRoute, value: [q.tokenIn, ...q.hops.map((h) => h.tokenOut)].join(" › ") },
        ],
        movesValue: true,
      },
      {
        apply: (hash) => settleSwap(q, hash),
        onFail: (error, hash, move) =>
          logFailure({
            kind: "swap",
            error,
            hash,
            route: q.hops.map((h) => h.poolId),
            tokenIn: q.tokenIn,
            amountIn: q.amountIn,
            tokenOut: q.tokenOut,
            amountOut: q.minReceived,
            move,
            toleranceBps: slippageBps,
            usd: q.amountIn * TOKENS[q.tokenIn].usd,
          }),
      }
    )
    setFrozen(null)
    if (ok) {
      const done = t(s.confirmed, { in: inText, out: formatToken(q.amountOut, q.tokenOut, locale) })
      setReceipt(done)
      setInput("")
    }
  }

  const feeEstimate = 0.00009 + (quote?.hops.length ?? 1) * 0.00011
  const details = hasAmount && quote ? (
    <dl className="flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm">
      <Row label={s.rate}>
        <span className="tabular-nums">
          1 {quote.tokenIn} = {formatPrice(quote.rate, locale)} {quote.tokenOut}
        </span>
      </Row>
      <Row label={s.route}>
        <RouteLine
          tokens={[quote.tokenIn, ...quote.hops.map((h) => h.tokenOut)]}
          fees={quote.hops.map((h) => formatPercent(h.fee, locale))}
        />
      </Row>
      <Row label={s.poolFee}>
        <span className="tabular-nums">{formatPercent(quote.feeFraction, locale)}</span>
      </Row>
      <Row label={s.impact}>
        <ImpactBadge level={level} label={s.levels[level]} value={formatPercent(quote.impact, locale)} />
      </Row>
      <Row label={s.minReceived}>
        <span className="font-semibold tabular-nums">
          {formatToken(quote.minReceived, quote.tokenOut, locale)}{" "}
          <span className="text-xs font-normal text-muted-foreground">({formatPercent(slippageBps / 10_000, locale)})</span>
        </span>
      </Row>
      <Row label={s.networkFee}>
        <span className="tabular-nums text-muted-foreground">{t(s.networkFeeValue, { fee: feeEstimate.toLocaleString(nf, { maximumFractionDigits: 5 }) })}</span>
      </Row>
      <details className="group -mx-1 mt-1 rounded-xl px-1">
        <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-primary-ink [&::-webkit-details-marker]:hidden">
          <CircleHelpIcon className="size-3.5" aria-hidden="true" />
          {s.explain}
        </summary>
        <ul className="mt-1.5 flex flex-col gap-1.5 pb-1 text-xs text-muted-foreground">
          <li>
            <strong className="text-foreground">{s.impact}.</strong> {s.help.impact}
          </li>
          <li>
            <strong className="text-foreground">{s.minReceived}.</strong> {s.help.min}
          </li>
          <li>
            <strong className="text-foreground">{s.poolFee}.</strong> {s.help.fee}
          </li>
        </ul>
      </details>
    </dl>
  ) : null

  const settingsPanel = (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-sm font-bold" id="slippage-title">
        {s.slippageTitle}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{s.slippageBody}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-labelledby="slippage-title">
        {SLIPPAGE_PRESETS.map((bps) => (
          <Button
            key={bps}
            type="button"
            size="sm"
            variant={slippageBps === bps ? "default" : "outline"}
            aria-pressed={slippageBps === bps}
            onClick={() => setSettings({ slippageBps: bps })}
          >
            {formatPercent(bps / 10_000, locale)}
          </Button>
        ))}
        <CustomSlippage
          key={slippageBps}
          bps={slippageBps}
          label={s.customLabel}
          placeholder={s.custom}
          onChange={(bps) => setSettings({ slippageBps: bps })}
        />
      </div>
      {slippageBps > 300 ? <p className="mt-2 text-xs font-semibold text-warning">{s.slippageHigh}</p> : null}
    </div>
  )

  const quoteOut = hasAmount && quote ? toInputString(quote.amountOut, tokenOut) : ""

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-8 lg:py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-display">{s.title}</h1>
        <SwapForm
          labels={{ title: s.title, pay: s.pay, receive: s.receive, reverse: s.reverse, settings: s.settings, token: s.token, max: s.max }}
          tokens={tokenOptions}
          fromToken={tokenIn}
          toToken={tokenOut}
          fromAmount={input}
          toAmount={quoteOut}
          status={status}
          swapLabel={label}
          onFromTokenChange={chooseIn}
          onToTokenChange={chooseOut}
          onFromAmountChange={(v) => {
            setInput(v)
            if (tx.state.phase === "confirmed" || tx.state.phase === "failed") tx.reset()
          }}
          onReverse={reverse}
          onSwap={swap}
          onOpenSettings={() => setSettingsOpen((o) => !o)}
          onMax={connected ? () => setInput(toInputString(balanceIn, tokenIn)) : undefined}
          settingsOpen={settingsOpen}
          settingsPanel={settingsPanel}
          fromInvalid={invalid || insufficient}
          fromHint={
            invalid ? (
              <span className="font-semibold text-destructive">{s.invalid}</span>
            ) : connected && demo ? (
              <span className={cn(insufficient && "font-semibold text-destructive")}>
                {t(s.balance, { amount: formatToken(balanceIn, tokenIn, locale) })}
              </span>
            ) : null
          }
          toHint={
            connected && demo ? t(s.balance, { amount: formatToken(demo.balances[tokenOut], tokenOut, locale) }) : null
          }
          details={details}
          beforeButton={
            hasAmount && level === "high" && !pending ? (
              <label className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <Checkbox
                  checked={acked}
                  onCheckedChange={(v) => setAckKey(v === true ? key : null)}
                  className="mt-0.5"
                />
                <span>{t(s.ack, { pct: formatPercent(quote!.impact, locale) })}</span>
              </label>
            ) : null
          }
          footer={
            <div className="flex flex-col gap-3">
              <TxFeedback
                state={tx.state}
                toleranceBps={slippageBps}
                confirmedLabel={receipt ?? undefined}
                onRetry={tx.state.error === "slippage" ? undefined : swap}
                onDismiss={tx.reset}
              />
            </div>
          }
        />
      </div>

      <div className="flex flex-col gap-6 lg:pt-[3.25rem]">
        <section className="rounded-3xl border bg-card p-4 sm:p-6" aria-labelledby="curve-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-1">
              <h2 id="curve-title" className="text-lg font-extrabold">
                {s.curve.title}
              </h2>
              <InfoTip label={s.curve.info}>{s.curve.intro}</InfoTip>
            </div>
            {quote && quote.hops.length > 1 ? (
              <div className="flex gap-1 rounded-full border p-1" role="group" aria-label={s.route}>
                {quote.hops.map((h, i) => (
                  <button
                    key={h.poolId}
                    type="button"
                    aria-pressed={i === hopIndex}
                    onClick={() => setHopIndex(i)}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-3 text-xs font-bold transition-colors",
                      i === hopIndex ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(s.curve.hop, { n: i + 1, total: quote.hops.length })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {hop && demo ? (
            <HopCurve
              key={`${hop.poolId}-${hop.tokenIn}`}
              x0={hop.rIn}
              y0={hop.rOut}
              x1={hasAmount ? hop.rInAfter : undefined}
              tokenIn={hop.tokenIn}
              tokenOut={hop.tokenOut}
              amountIn={hop.amountIn}
              amountOut={hop.amountOut}
              pending={tx.state.phase === "pending"}
              labels={s.curve}
              spot={`${s.curve.spot}: 1 ${hop.tokenIn} = ${formatPrice(hop.rOut / hop.rIn, locale)} ${hop.tokenOut}`}
              execution={hasAmount ? `${s.curve.execution}: 1 ${hop.tokenIn} = ${formatPrice(hop.amountOut / hop.amountIn, locale)} ${hop.tokenOut}` : undefined}
              locale={locale}
            />
          ) : (
            <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
          )}
          {!hasAmount && demo ? <p className="mt-3 text-sm text-muted-foreground">{s.curve.empty}</p> : null}
        </section>

        {connected && demo?.activity.some((a) => a.kind === "swap") ? <RecentSwaps /> : null}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

function CustomSlippage({ bps, label, placeholder, onChange }: { bps: number; label: string; placeholder: string; onChange: (bps: number) => void }) {
  const [value, setValue] = useState(SLIPPAGE_PRESETS.includes(bps) ? "" : String(bps / 100))
  return (
    <span className="relative inline-flex items-center">
      <Input
        aria-label={label}
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          const n = parseAmount(e.target.value)
          if (n !== null && n > 0 && n <= 50) onChange(Math.round(n * 100))
        }}
        className="h-9 w-32 rounded-full pr-7 text-sm"
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 text-sm text-muted-foreground">
        %
      </span>
    </span>
  )
}

function HopCurve({
  x0,
  y0,
  x1,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  pending,
  labels,
  spot,
  execution,
  locale,
}: {
  x0: number
  y0: number
  x1?: number
  tokenIn: TokenSymbol
  tokenOut: TokenSymbol
  amountIn: number
  amountOut: number
  pending: boolean
  labels: ReturnType<typeof useAppCopy>["app"]["swap"]["curve"]
  spot: string
  execution?: string
  locale: ReturnType<typeof useAppCopy>["locale"]
}) {
  const target = x1 ?? x0
  const tweened = useTween(target, 400)
  const pair = `${tokenIn}/${tokenOut}`
  return (
    <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start">
      <CurveChart
        x0={x0}
        y0={y0}
        x1={x1 !== undefined ? tweened : undefined}
        labels={{
          title: t(labels.label, { pair }),
          axisIn: t(labels.axisIn, { symbol: tokenIn }),
          axisOut: t(labels.axisOut, { symbol: tokenOut }),
          now: labels.now,
          after: labels.after,
          spot,
          execution,
          deltaIn: x1 !== undefined ? `+${formatToken(amountIn, tokenIn, locale)}` : undefined,
          deltaOut: x1 !== undefined ? `−${formatToken(amountOut, tokenOut, locale)}` : undefined,
        }}
      />
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-muted-foreground">{labels.reserves}</p>
        <ReserveBars
          locale={locale}
          label={labels.reserves}
          active={pending}
          tanks={[
            { symbol: tokenIn, now: x0, after: x1 ?? x0 },
            { symbol: tokenOut, now: y0, after: x1 !== undefined ? y0 - amountOut : y0 },
          ]}
        />
      </div>
    </div>
  )
}

function RecentSwaps() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const r = app.swap.recent
  const swaps = demo?.activity.filter((a) => a.kind === "swap").slice(0, 4) ?? []
  const nf = intlLocale[locale]
  return (
    <section className="rounded-3xl border bg-card p-4 sm:p-6" aria-labelledby="recent-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-title" className="text-lg font-extrabold">
          {r.title}
        </h2>
        <Link href={href(locale, "/app/activity")} className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary-ink underline-offset-4 hover:underline">
          {r.all}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {demo && demo.wallet.status === "connected" && swaps.length ? (
        <ul className="mt-3 divide-y">
          {swaps.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                {a.tokenIn && a.tokenOut ? (
                  <>
                    <TokenAmount value={toBaseUnits(a.amountIn ?? 0, a.tokenIn)} decimals={TOKENS[a.tokenIn].decimals} symbol={a.tokenIn} fractionDigits={4} locale={nf} />
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <TokenAmount value={toBaseUnits(a.amountOut ?? 0, a.tokenOut)} decimals={TOKENS[a.tokenOut].decimals} symbol={a.tokenOut} fractionDigits={4} locale={nf} />
                  </>
                ) : null}
              </span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                {formatRelative(a.at, locale)}
                {a.hash ? (
                  <TxStatus
                    status={a.status === "confirmed" ? "confirmed" : "failed"}
                    hash={a.hash}
                    label={app.activity.status[a.status]}
                    className="py-1"
                  />
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{r.empty}</p>
      )}
    </section>
  )
}
