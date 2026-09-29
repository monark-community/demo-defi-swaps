"use client"

import { DropletIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { TokenAmount } from "@/components/ui/token-amount"
import { Wallet } from "@/components/ui/wallet"
import { intlLocale } from "@/i18n/config"
import { useTx } from "@/lib/demo/chain"
import { dripFaucet, logFailure } from "@/lib/demo/ops"
import { FAUCET } from "@/lib/demo/seed"
import { useDemo } from "@/lib/demo/store"
import { toBaseUnits, TOKENS, TOKEN_LIST, usdOf } from "@/lib/demo/tokens"
import { formatToken, formatUsd } from "@/lib/format"

import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TokenMark } from "./token-mark"
import { TxFeedback } from "./tx-feedback"
import { ConnectButton } from "./connect-button"

/** Balances and the testnet faucet, one tap away in the app bar. */
export function WalletSheet() {
  const demo = useDemo()
  const { app, locale, close, tokens, disclaimer } = useAppCopy()
  const w = app.wallet
  const tx = useTx()
  const connected = demo?.wallet.status === "connected"
  const total = demo ? TOKEN_LIST.reduce((sum, s) => sum + usdOf(demo.balances[s], s), 0) : 0

  const drip = () =>
    tx.run(
      {
        title: w.faucetTitle,
        rows: TOKEN_LIST.map((s) => ({ label: tokens[s], value: `+${formatToken(FAUCET[s], s, locale)}` })),
        movesValue: false,
      },
      {
        apply: (hash) => dripFaucet(hash),
        onFail: (error, hash) => logFailure({ kind: "faucet", error, hash }),
      }
    )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <WalletIcon aria-hidden="true" />
          <span className="hidden sm:inline">{w.balances}</span>
          {connected ? (
            <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">{formatUsd(total, locale, { compact: true })}</span>
          ) : null}
          <span className="sr-only sm:hidden">{w.balances}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={close} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4 text-left">
          <SheetTitle className="text-base font-extrabold">{w.balancesTitle}</SheetTitle>
          <SheetDescription>{w.faucetHint}</SheetDescription>
        </SheetHeader>
        {demo && connected ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <Wallet address={demo.wallet.address} name={w.name} copyLabel={w.copy} copiedLabel={w.copied} className="w-full" />
              <ul className="mt-4 divide-y rounded-2xl border">
                {TOKEN_LIST.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <TokenMark symbol={s} size={28} />
                      <span className="min-w-0">
                        <span className="block font-bold">{s}</span>
                        <span className="block truncate text-xs text-muted-foreground">{tokens[s]}</span>
                      </span>
                    </span>
                    <TokenAmount
                      value={toBaseUnits(demo.balances[s], s)}
                      decimals={TOKENS[s].decimals}
                      fractionDigits={s === "tWBTC" ? 6 : 4}
                      locale={intlLocale[locale]}
                      usdValue={usdOf(demo.balances[s], s)}
                      className="items-end text-right font-semibold"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 border-t px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <TxFeedback state={tx.state} confirmedLabel={w.faucetDone} onRetry={drip} onDismiss={tx.reset} />
              <Button onClick={drip} disabled={tx.busy} className="w-full">
                <DropletIcon aria-hidden="true" />
                {w.faucet}
              </Button>
              <Disclaimer text={disclaimer} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-start gap-4 px-5 py-6">
            <p className="text-muted-foreground">{w.balancesEmpty}</p>
            <ConnectButton />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
