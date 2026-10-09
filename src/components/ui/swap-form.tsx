"use client"

// Fork of the @monark/ui 2 swap-form block, extended for Fluidswap: balances
// with a Max action, an invalid state, an inline settings panel, custom quote
// details, a slot above the button and a footer slot. The registry block has
// none of these yet, so the fork stays; its look follows the 2.x block.

import * as React from "react"
import { ArrowDownIcon, Loader2Icon, SettingsIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field-error"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface SwapToken {
  /** Unique symbol key; used as the Select option value. */
  symbol: string
  /** Display name, e.g. "Test Ether". */
  name?: string
  /** Optional icon element rendered before the symbol in the Select. */
  icon?: React.ReactNode
}

export interface SwapFormLabels {
  title: string
  pay: string
  receive: string
  reverse: string
  settings: string
  token: string
  max: string
}

const DEFAULT_LABELS: SwapFormLabels = {
  title: "Swap",
  pay: "You pay",
  receive: "You receive",
  reverse: "Reverse swap direction",
  settings: "Swap settings",
  token: "Token",
  max: "Max",
}

export interface SwapFormProps extends Omit<React.HTMLAttributes<HTMLFormElement>, "title"> {
  tokens: SwapToken[]
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  /** Button state: "idle" disables it (with `swapLabel` giving the reason). */
  status?: "idle" | "quoting" | "ready" | "confirming" | "error"
  errorMessage?: React.ReactNode
  onFromTokenChange?: (symbol: string) => void
  onToTokenChange?: (symbol: string) => void
  onFromAmountChange?: (value: string) => void
  onReverse?: () => void
  onSwap?: () => void
  onOpenSettings?: () => void
  onMax?: () => void
  swapLabel?: React.ReactNode
  labels?: Partial<SwapFormLabels>
  /** Balance lines under each field. */
  fromHint?: React.ReactNode
  toHint?: React.ReactNode
  /** Marks the pay field invalid (e.g. not enough balance). */
  fromInvalid?: boolean
  settingsOpen?: boolean
  settingsPanel?: React.ReactNode
  /** Quote breakdown between the fields and the button. */
  details?: React.ReactNode
  /** Rendered under the button: acknowledgements, transaction feedback, disclaimer. */
  footer?: React.ReactNode
  /** Rendered just above the button (e.g. a confirmation checkbox). */
  beforeButton?: React.ReactNode
}

function SwapForm({
  tokens,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  status = "idle",
  errorMessage,
  onFromTokenChange,
  onToTokenChange,
  onFromAmountChange,
  onReverse,
  onSwap,
  onOpenSettings,
  onMax,
  swapLabel,
  labels: labelsProp,
  fromHint,
  toHint,
  fromInvalid,
  settingsOpen,
  settingsPanel,
  details,
  footer,
  beforeButton,
  className,
  ...props
}: SwapFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const isBusy = status === "quoting" || status === "confirming"
  const isDisabled = status === "idle" || isBusy

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isDisabled && onSwap) onSwap()
  }

  return (
    <form
      data-slot="swap-form"
      className={cn("flex w-full flex-col gap-3 rounded-3xl border bg-card p-4 sm:p-5", className)}
      onSubmit={handleSubmit}
      noValidate
      {...props}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{labels.title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          aria-label={labels.settings}
          aria-expanded={settingsOpen}
        >
          <SettingsIcon />
        </Button>
      </header>

      {settingsOpen && settingsPanel ? settingsPanel : null}

      <TokenField
        side="from"
        label={labels.pay}
        tokenLabel={labels.token}
        token={fromToken}
        amount={fromAmount}
        tokens={tokens}
        hint={fromHint}
        invalid={fromInvalid}
        onTokenChange={onFromTokenChange}
        onAmountChange={onFromAmountChange}
        action={
          onMax ? (
            <Button type="button" variant="outline" size="xs" onClick={onMax}>
              {labels.max}
            </Button>
          ) : null
        }
      />

      {/* Overlaps both fields, as the reverse button does in most swap UIs. */}
      <div className="relative z-10 -my-6 flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="bg-card"
          onClick={onReverse}
          aria-label={labels.reverse}
        >
          <ArrowDownIcon />
        </Button>
      </div>

      <TokenField
        side="to"
        label={labels.receive}
        tokenLabel={labels.token}
        token={toToken}
        amount={toAmount}
        tokens={tokens}
        readOnly
        hint={toHint}
        onTokenChange={onToTokenChange}
      />

      {details}

      {beforeButton}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isDisabled}
        aria-busy={isBusy || undefined}
        data-status={status}
      >
        {isBusy && <Loader2Icon className="animate-spin" aria-hidden="true" />}
        {swapLabel ?? labels.title}
      </Button>

      {status === "error" && errorMessage && <FieldError>{errorMessage}</FieldError>}

      {footer}
    </form>
  )
}

function TokenField({
  side,
  label,
  tokenLabel,
  token,
  amount,
  tokens,
  readOnly,
  hint,
  invalid,
  action,
  onTokenChange,
  onAmountChange,
}: {
  side: "from" | "to"
  label: string
  tokenLabel: string
  token: string
  amount: string
  tokens: SwapToken[]
  readOnly?: boolean
  hint?: React.ReactNode
  invalid?: boolean
  action?: React.ReactNode
  onTokenChange?: (symbol: string) => void
  onAmountChange?: (value: string) => void
}) {
  const inputId = `swap-${side}-amount`
  const selectId = `swap-${side}-token`
  const hintId = `swap-${side}-hint`

  return (
    // The amount input is borderless, so the whole panel shows the focus ring.
    <div
      data-slot="swap-form-field"
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl border bg-background p-4 transition-[color,box-shadow] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50",
        invalid && "border-destructive/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">
          {label}
        </Label>
        {action}
      </div>
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amount}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => onAmountChange?.(e.target.value)}
          className="w-full min-w-0 bg-transparent text-2xl font-extrabold tabular-nums outline-none placeholder:text-muted-foreground"
        />
        <Select value={token} onValueChange={onTokenChange}>
          <SelectTrigger
            id={selectId}
            size="sm"
            aria-label={`${label}: ${tokenLabel}`}
            className="w-auto min-w-28 shrink-0 [&_.token-name]:hidden"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((t) => (
              <SelectItem key={t.symbol} value={t.symbol}>
                <span className="flex items-center gap-2">
                  {t.icon && (
                    <span aria-hidden="true" className="flex items-center justify-center">
                      {t.icon}
                    </span>
                  )}
                  <span className="font-bold">{t.symbol}</span>
                  {t.name ? <span className="token-name text-xs text-muted-foreground">{t.name}</span> : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hint ? (
        <div id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  )
}

export { SwapForm }
