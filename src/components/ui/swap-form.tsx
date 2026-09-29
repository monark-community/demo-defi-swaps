"use client"

import * as React from "react"
import { ArrowDownIcon, SettingsIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SwapToken {
  /** Unique symbol key; used as the Select option value. */
  symbol: string
  /** Display name, e.g. "Ether". */
  name?: string
  /** Optional icon element rendered before the symbol in the Select. */
  icon?: React.ReactNode
}

export interface SwapFormValues {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  slippageBps: number
}

export interface SwapFormProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Tokens available in both the from-token and to-token selects. */
  tokens: SwapToken[]
  /** Controlled "from" token symbol. */
  fromToken: string
  /** Controlled "to" token symbol. */
  toToken: string
  /** Controlled "from" amount (as a string so consumers can pass wei / base units). */
  fromAmount: string
  /** Controlled "to" amount; typically derived from a quote. */
  toAmount: string
  /** Slippage tolerance in basis points (e.g. 50 = 0.5%). */
  slippageBps?: number
  /** Estimated exchange rate label; e.g. "1 ETH = 2,342 USDC". */
  rate?: React.ReactNode
  /** Estimated network fee; e.g. "$1.23". */
  networkFee?: React.ReactNode
  /** Minimum received after slippage; e.g. "2,318 USDC". */
  minimumReceived?: React.ReactNode
  /** Button state: "idle" | "quoting" | "ready" | "confirming" | "error". */
  status?: "idle" | "quoting" | "ready" | "confirming" | "error"
  /** Optional error message rendered under the form. */
  errorMessage?: React.ReactNode
  onFromTokenChange?: (symbol: string) => void
  onToTokenChange?: (symbol: string) => void
  onFromAmountChange?: (value: string) => void
  onToAmountChange?: (value: string) => void
  onSlippageChange?: (bps: number) => void
  /** User reversed the from / to direction. */
  onReverse?: () => void
  /** User triggered the swap. */
  onSwap?: () => void
  /** Clicked the settings icon; consumer renders the slippage UI. */
  onOpenSettings?: () => void
  /** Button label; defaults depend on status. */
  swapLabel?: React.ReactNode
}

const STATUS_LABELS: Record<NonNullable<SwapFormProps["status"]>, string> = {
  idle: "Enter an amount",
  quoting: "Fetching quote…",
  ready: "Swap",
  confirming: "Confirming…",
  error: "Try again",
}

function SwapForm({
  tokens,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  slippageBps = 50,
  rate,
  networkFee,
  minimumReceived,
  status = "idle",
  errorMessage,
  onFromTokenChange,
  onToTokenChange,
  onFromAmountChange,
  onToAmountChange,
  onReverse,
  onSwap,
  onOpenSettings,
  swapLabel,
  className,
  ...props
}: SwapFormProps) {
  const isBusy = status === "quoting" || status === "confirming"
  const isDisabled = status === "idle" || isBusy

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isDisabled && onSwap) onSwap()
  }

  return (
    <form
      data-slot="swap-form"
      className={cn(
        "flex w-full max-w-md flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Swap</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onOpenSettings}
          aria-label="Swap settings"
        >
          <SettingsIcon className="size-4" />
        </Button>
      </header>

      <TokenField
        side="from"
        label="You pay"
        token={fromToken}
        amount={fromAmount}
        tokens={tokens}
        onTokenChange={onFromTokenChange}
        onAmountChange={onFromAmountChange}
      />

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          onClick={onReverse}
          aria-label="Reverse swap direction"
        >
          <ArrowDownIcon className="size-4" />
        </Button>
      </div>

      <TokenField
        side="to"
        label="You receive"
        token={toToken}
        amount={toAmount}
        tokens={tokens}
        readOnly
        onTokenChange={onToTokenChange}
        onAmountChange={onToAmountChange}
      />

      {(rate || networkFee || minimumReceived) && (
        <>
          <Separator />
          <dl className="flex flex-col gap-1 text-xs">
            {rate && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rate</dt>
                <dd className="tabular-nums">{rate}</dd>
              </div>
            )}
            {networkFee && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Network fee</dt>
                <dd className="tabular-nums">{networkFee}</dd>
              </div>
            )}
            {minimumReceived && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Min. received ({(slippageBps / 100).toFixed(2)}% slippage)
                </dt>
                <dd className="tabular-nums">{minimumReceived}</dd>
              </div>
            )}
          </dl>
        </>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isDisabled}
        data-status={status}
      >
        {swapLabel ?? STATUS_LABELS[status]}
      </Button>

      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="text-xs text-destructive"
        >
          {errorMessage}
        </p>
      )}
    </form>
  )
}

function TokenField({
  side,
  label,
  token,
  amount,
  tokens,
  readOnly,
  onTokenChange,
  onAmountChange,
}: {
  side: "from" | "to"
  label: string
  token: string
  amount: string
  tokens: SwapToken[]
  readOnly?: boolean
  onTokenChange?: (symbol: string) => void
  onAmountChange?: (value: string) => void
}) {
  const inputId = `swap-${side}-amount`
  const selectId = `swap-${side}-token`

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2">
      <Label htmlFor={inputId} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => onAmountChange?.(e.target.value)}
          className="border-0 bg-transparent p-0 text-lg font-semibold tabular-nums shadow-none focus-visible:ring-0"
        />
        <Select value={token} onValueChange={onTokenChange}>
          <SelectTrigger id={selectId} className="w-auto min-w-[7rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((t) => (
              <SelectItem key={t.symbol} value={t.symbol}>
                <span className="flex items-center gap-2">
                  {t.icon && (
                    <span
                      aria-hidden="true"
                      className="flex size-4 items-center justify-center [&>*]:size-full"
                    >
                      {t.icon}
                    </span>
                  )}
                  <span className="font-medium">{t.symbol}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export { SwapForm }
