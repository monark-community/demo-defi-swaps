"use client"

import { MinusIcon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenAmount } from "@/components/ui/token-amount"
import { intlLocale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { lpForDeposit, pairedAmount, viewPosition } from "@/lib/demo/amm"
import { useTx } from "@/lib/demo/chain"
import { logFailure, settleDeposit, settleWithdraw } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { FEE_TIERS, parseAmount, toBaseUnits, toInputString, TOKENS, usdOf } from "@/lib/demo/tokens"
import type { Pool, TokenSymbol } from "@/lib/demo/types"
import { formatNumber, formatPercent, formatPrice, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { ConnectButton } from "./connect-button"
import { Disclaimer } from "./disclaimer"
import { TokenMark } from "./token-mark"
import { TxFeedback } from "./tx-feedback"

/* ------------------------------------------------------------------------ */

function AmountField({
  symbol,
  label,
  value,
  onChange,
  balance,
  invalid,
}: {
  symbol: TokenSymbol
  label: string
  value: string
  onChange: (v: string) => void
  balance?: string
  invalid?: boolean
}) {
  const id = useId()
  return (
    <div className={cn("rounded-2xl border bg-background px-4 py-3 focus-within:border-input", invalid && "border-destructive/60")}>
      <Label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={balance ? `${id}-bal` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-2xl font-bold tabular-nums focus-visible:outline-none"
        />
        <span className="inline-flex shrink-0 items-center gap-1.5 font-bold">
          <TokenMark symbol={symbol} size={22} />
          {symbol}
        </span>
      </div>
      {balance ? (
        <p id={`${id}-bal`} className={cn("mt-1 text-xs text-muted-foreground", invalid && "font-semibold text-destructive")}>
          {balance}
        </p>
      ) : null}
    </div>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Position                                                                 */
/* ------------------------------------------------------------------------ */

export function PositionCard({ pool }: { pool: Pool }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const p = app.pool.position
  const position = demo?.positions.find((x) => x.poolId === pool.id)
  const connected = demo?.wallet.status === "connected"
  const v = position ? viewPosition(pool, position) : null
  const [tab, setTab] = useState("add")
  const nf = intlLocale[locale]

  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="position-title">
      <h2 id="position-title" className="text-lg font-extrabold">
        {p.title}
      </h2>

      {!connected ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{p.connect}</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          {position && v ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{p.value}</p>
                  <p className="text-2xl font-extrabold tabular-nums">{formatUsd(v.valueUsd, locale)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{p.share}</p>
                  <p className="text-2xl font-extrabold tabular-nums">{formatPercent(v.share, locale)}</p>
                </div>
              </div>
              {/* Your share of the pool as a slice of the reserves */}
              <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, v.share * 100)}%` }} />
              </div>
              <dl className="flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm">
                <Line label={p.tokens}>
                  <span className="flex flex-col items-end">
                    <TokenAmount value={toBaseUnits(v.amountA, pool.a)} decimals={TOKENS[pool.a].decimals} symbol={pool.a} fractionDigits={4} locale={nf} />
                    <TokenAmount value={toBaseUnits(v.amountB, pool.b)} decimals={TOKENS[pool.b].decimals} symbol={pool.b} fractionDigits={pool.b === "tETH" ? 4 : 2} locale={nf} />
                  </span>
                </Line>
                <Line label={p.feesEarned}>
                  <span className="text-success">+{formatUsd(position.feesUsd, locale)}</span>
                </Line>
                <Line label={p.vsHold}>
                  <span className={cn(v.vsHold < -0.00005 ? "text-destructive" : "text-foreground")}>
                    {v.vsHold >= 0 ? "+" : ""}
                    {formatPercent(v.vsHold, locale)} ({v.valueUsd - v.holdUsd >= 0 ? "+" : "−"}
                    {formatUsd(Math.abs(v.valueUsd - v.holdUsd), locale)})
                  </span>
                </Line>
                <Line label={p.lp}>{formatNumber(position.lp, locale, 4)}</Line>
              </dl>
              <p className="text-xs text-muted-foreground">{p.vsHoldHelp}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{p.empty}</p>
          )}

          <Tabs value={position ? tab : "add"} onValueChange={setTab} className="mt-5">
            <TabsList className="w-full">
              <TabsTrigger value="add" className="flex-1">
                <PlusIcon className="size-4" aria-hidden="true" />
                {app.pool.add.tab}
              </TabsTrigger>
              <TabsTrigger value="remove" className="flex-1" disabled={!position}>
                <MinusIcon className="size-4" aria-hidden="true" />
                {app.pool.remove.tab}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="add" className="mt-4">
              <AddLiquidity pool={pool} />
            </TabsContent>
            <TabsContent value="remove" className="mt-4">
              {position ? <RemoveLiquidity pool={pool} /> : null}
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* Add                                                                      */
/* ------------------------------------------------------------------------ */

function AddLiquidity({ pool }: { pool: Pool }) {
  const demo = useDemo()
  const { app, locale, disclaimer } = useAppCopy()
  const a = app.pool.add
  const tx = useTx()
  const [valA, setValA] = useState("")
  const [valB, setValB] = useState("")

  const amountA = parseAmount(valA) ?? 0
  const amountB = parseAmount(valB) ?? 0
  const balA = demo?.balances[pool.a] ?? 0
  const balB = demo?.balances[pool.b] ?? 0
  const shortA = amountA > balA + 1e-12
  const shortB = amountB > balB + 1e-12
  const minted = amountA > 0 && amountB > 0 ? lpForDeposit(pool, amountA, amountB) : 0
  const own = demo?.positions.find((x) => x.poolId === pool.id)?.lp ?? 0
  const newShare = minted > 0 ? (own + minted) / (pool.lpSupply + minted) : 0
  const value = usdOf(amountA, pool.a) + usdOf(amountB, pool.b)

  const onA = (v: string) => {
    setValA(v)
    const n = parseAmount(v)
    setValB(n && n > 0 ? toInputString(pairedAmount(pool, pool.a, n), pool.b) : "")
    if (tx.state.phase === "confirmed" || tx.state.phase === "failed") tx.reset()
  }
  const onB = (v: string) => {
    setValB(v)
    const n = parseAmount(v)
    setValA(n && n > 0 ? toInputString(pairedAmount(pool, pool.b, n), pool.a) : "")
    if (tx.state.phase === "confirmed" || tx.state.phase === "failed") tx.reset()
  }

  let label = a.button
  let disabled = false
  if (tx.busy) {
    label = a.adding
    disabled = true
  } else if (!(amountA > 0 && amountB > 0)) {
    label = a.enter
    disabled = true
  } else if (shortA || shortB) {
    label = t(a.insufficient, { symbol: shortA ? pool.a : pool.b })
    disabled = true
  }

  const pair = `${pool.a}/${pool.b}`
  const submit = async () => {
    const ia = amountA
    const ib = amountB
    const textA = formatToken(ia, pool.a, locale)
    const textB = formatToken(ib, pool.b, locale)
    const ok = await tx.run(
      {
        title: t(a.summary, { a: textA, b: textB, pair }),
        rows: [
          { label: a.lpMinted, value: formatNumber(minted, locale, 4) },
          { label: a.newShare, value: formatPercent(newShare, locale) },
          { label: a.depositValue, value: formatUsd(value, locale) },
        ],
        movesValue: true,
      },
      {
        apply: (hash) => settleDeposit(pool.id, ia, ib, hash),
        onFail: (error, hash) => logFailure({ kind: "add", error, hash, poolId: pool.id, amountA: ia, amountB: ib }),
      }
    )
    if (ok) {
      setValA("")
      setValB("")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{a.hint}</p>
      <AmountField
        symbol={pool.a}
        label={t(a.amount, { symbol: pool.a })}
        value={valA}
        onChange={onA}
        invalid={shortA}
        balance={t(app.swap.balance, { amount: formatToken(balA, pool.a, locale) })}
      />
      <AmountField
        symbol={pool.b}
        label={t(a.amount, { symbol: pool.b })}
        value={valB}
        onChange={onB}
        invalid={shortB}
        balance={t(app.swap.balance, { amount: formatToken(balB, pool.b, locale) })}
      />
      {minted > 0 ? (
        <dl className="flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm">
          <Line label={a.lpMinted}>{formatNumber(minted, locale, 4)}</Line>
          <Line label={a.newShare}>{formatPercent(newShare, locale)}</Line>
          <Line label={a.depositValue}>{formatUsd(value, locale)}</Line>
        </dl>
      ) : null}
      <Button size="lg" className="w-full" disabled={disabled} onClick={submit}>
        {label}
      </Button>
      <TxFeedback state={tx.state} confirmedLabel={t(a.confirmed, { pair })} onRetry={submit} onDismiss={tx.reset} />
      <Disclaimer text={disclaimer} />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Remove                                                                   */
/* ------------------------------------------------------------------------ */

function RemoveLiquidity({ pool }: { pool: Pool }) {
  const demo = useDemo()
  const { app, locale, disclaimer } = useAppCopy()
  const r = app.pool.remove
  const tx = useTx()
  const [pct, setPct] = useState(50)
  const [done, setDone] = useState<string | null>(null)
  const position = demo?.positions.find((x) => x.poolId === pool.id)
  const nf = intlLocale[locale]
  if (!position) return null
  const fraction = pct / 100
  const burn = position.lp * fraction
  const outA = (burn / pool.lpSupply) * pool.reserveA
  const outB = (burn / pool.lpSupply) * pool.reserveB
  const pair = `${pool.a}/${pool.b}`

  const submit = async () => {
    const f = fraction
    const textA = formatToken(outA, pool.a, locale)
    const textB = formatToken(outB, pool.b, locale)
    const ok = await tx.run(
      {
        title: t(r.summary, { pct: formatPercent(f, locale, 0), pair }),
        rows: [
          { label: r.receive, value: `${textA} + ${textB}` },
          { label: r.burn, value: formatNumber(burn, locale, 4) },
        ],
        movesValue: true,
      },
      {
        apply: (hash) => settleWithdraw(pool.id, f, hash),
        onFail: (error, hash) => logFailure({ kind: "remove", error, hash, poolId: pool.id, amountA: outA, amountB: outB }),
      }
    )
    // Closing the position unmounts this form, so that case also gets a toast.
    if (ok) setDone(t(r.confirmed, { a: textA, b: textB }))
    if (ok && f >= 0.9999) toast.success(r.closed)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">{r.percent}</p>
        <p className="text-3xl font-extrabold tabular-nums">{formatPercent(fraction, locale, 0)}</p>
      </div>
      <Slider
        min={1}
        max={100}
        step={1}
        value={[pct]}
        onValueChange={(v) => setPct(v[0] ?? 1)}
        thumbLabel={r.percentLabel}
        valueText={formatPercent(fraction, locale, 0)}
        disabled={tx.busy}
      />
      <div className="grid grid-cols-4 gap-2">
        {[25, 50, 75, 100].map((x) => (
          <Button key={x} type="button" size="sm" variant={pct === x ? "default" : "outline"} aria-pressed={pct === x} onClick={() => setPct(x)} disabled={tx.busy}>
            {formatPercent(x / 100, locale, 0)}
          </Button>
        ))}
      </div>
      <dl className="flex flex-col gap-2 rounded-2xl border px-4 py-3 text-sm">
        <Line label={r.receive}>
          <span className="flex flex-col items-end">
            <TokenAmount value={toBaseUnits(outA, pool.a)} decimals={TOKENS[pool.a].decimals} symbol={pool.a} fractionDigits={4} locale={nf} />
            <TokenAmount value={toBaseUnits(outB, pool.b)} decimals={TOKENS[pool.b].decimals} symbol={pool.b} fractionDigits={pool.b === "tETH" ? 4 : 2} locale={nf} />
          </span>
        </Line>
        <Line label={r.burn}>{formatNumber(burn, locale, 4)}</Line>
      </dl>
      <p className="text-xs text-muted-foreground">{r.feesIncluded}</p>
      <Button size="lg" variant="outline" className="w-full" disabled={tx.busy} onClick={submit}>
        {tx.busy ? r.removing : r.button}
      </Button>
      <TxFeedback state={tx.state} confirmedLabel={done ?? undefined} onRetry={submit} onDismiss={tx.reset} />
      <Disclaimer text={disclaimer} />
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* Create a pool                                                            */
/* ------------------------------------------------------------------------ */

export function CreatePool({ pairId, a, b }: { pairId: string; a: TokenSymbol; b: TokenSymbol }) {
  const demo = useDemo()
  const { app, locale, disclaimer } = useAppCopy()
  const c = app.pool.create
  const tx = useTx()
  const [valA, setValA] = useState("")
  const [valB, setValB] = useState("")
  const [fee, setFee] = useState<number>(0.003)
  const reference = TOKENS[a].usd / TOKENS[b].usd
  const amountA = parseAmount(valA) ?? 0
  const amountB = parseAmount(valB) ?? 0
  const price = amountA > 0 && amountB > 0 ? amountB / amountA : 0
  const deviation = price > 0 ? price / reference - 1 : 0
  const balA = demo?.balances[a] ?? 0
  const balB = demo?.balances[b] ?? 0
  const shortA = amountA > balA + 1e-12
  const shortB = amountB > balB + 1e-12
  const connected = demo?.wallet.status === "connected"
  const pair = `${a}/${b}`

  let label = c.button
  let disabled = false
  if (tx.busy) {
    label = c.creating
    disabled = true
  } else if (!(amountA > 0 && amountB > 0)) {
    label = app.pool.add.enter
    disabled = true
  } else if (shortA || shortB) {
    label = t(app.pool.add.insufficient, { symbol: shortA ? a : b })
    disabled = true
  }

  const submit = async () => {
    const ia = amountA
    const ib = amountB
    const f = fee
    const ok = await tx.run(
      {
        title: t(c.summary, { pair, a: formatToken(ia, a, locale), b: formatToken(ib, b, locale) }),
        rows: [
          { label: c.price, value: `1 ${a} = ${formatPrice(ib / ia, locale)} ${b}` },
          { label: c.fee, value: formatPercent(f, locale) },
        ],
        movesValue: true,
      },
      {
        apply: (hash) => settleDeposit(pairId, ia, ib, hash, f),
        onFail: (error, hash) => logFailure({ kind: "create", error, hash, poolId: pairId, amountA: ia, amountB: ib }),
      }
    )
    if (ok) {
      toast.success(t(c.confirmed, { pair }))
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border bg-card p-5 sm:p-7" aria-labelledby="create-title">
      <h1 id="create-title" className="text-2xl font-extrabold tracking-display">
        {t(c.title, { pair })}
      </h1>
      <p className="mt-2 text-muted-foreground">{c.body}</p>

      {!connected ? (
        <div className="mt-5">
          <ConnectButton />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <AmountField
            symbol={a}
            label={t(app.pool.add.amount, { symbol: a })}
            value={valA}
            onChange={setValA}
            invalid={shortA}
            balance={t(app.swap.balance, { amount: formatToken(balA, a, locale) })}
          />
          <AmountField
            symbol={b}
            label={t(app.pool.add.amount, { symbol: b })}
            value={valB}
            onChange={setValB}
            invalid={shortB}
            balance={t(app.swap.balance, { amount: formatToken(balB, b, locale) })}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{t(c.reference, { a, b, price: formatPrice(reference, locale) })}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!(amountA > 0)}
              onClick={() => setValB(toInputString(amountA * reference, b))}
            >
              {c.useReference}
            </Button>
          </div>
          {price > 0 ? (
            <p className="text-sm">
              <span className="text-muted-foreground">{c.price}: </span>
              <span className="font-bold tabular-nums">
                1 {a} = {formatPrice(price, locale)} {b}
              </span>
            </p>
          ) : null}
          {price > 0 && Math.abs(deviation) > 0.02 ? (
            <p role="alert" className="flex items-start gap-2 rounded-2xl border border-warning/50 bg-warning/5 p-3 text-sm">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              {t(c.deviation, { pct: formatPercent(Math.abs(deviation), locale) })}
            </p>
          ) : null}

          <fieldset className="mt-1">
            <legend className="text-sm font-bold">{c.fee}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FEE_TIERS.map((tier) => (
                <label
                  key={tier}
                  className={cn(
                    "flex cursor-pointer flex-col items-center rounded-2xl border px-2 py-2.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                    fee === tier ? "border-primary bg-secondary" : "hover:bg-muted"
                  )}
                >
                  <input type="radio" name="fee" value={tier} checked={fee === tier} onChange={() => setFee(tier)} className="sr-only" />
                  <span className="font-bold tabular-nums">{formatPercent(tier, locale)}</span>
                  <span className="text-xs text-muted-foreground">{c.feeHints[String(tier) as keyof typeof c.feeHints]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button size="lg" className="mt-2 w-full" disabled={disabled} onClick={submit}>
            {label}
          </Button>
          <TxFeedback state={tx.state} onRetry={submit} onDismiss={tx.reset} />
          <Disclaimer text={disclaimer} />
        </div>
      )}
    </section>
  )
}
