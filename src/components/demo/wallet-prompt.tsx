"use client"

import { useMemo } from "react"

import { MonarkMark } from "@/components/ui/site-brand"
import { WalletPrompt as MonarkWalletPrompt } from "@/components/ui/wallet-prompt"
import { estimateFee } from "@/lib/demo/chain"
import { useDemo, usePrompt } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"

import { useAppCopy } from "./app-provider"

/** The simulated wallet's confirmation sheet (@monark/ui wallet-prompt). Closing it counts as a rejection. */
export function WalletPrompt() {
  const prompt = usePrompt()
  const demo = useDemo()
  const { app, disclaimer, locale, close } = useAppCopy()
  const p = app.prompt
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : 0), [prompt])
  const feeText = fee ? `${fee.toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 5 })} tETH` : undefined
  const summary = prompt?.summary

  return (
    <MonarkWalletPrompt
      open={!!prompt}
      onReject={() => prompt?.resolve(false)}
      onConfirm={() => prompt?.resolve(true)}
      site={
        <>
          <MonarkMark />
          {p.site}
        </>
      }
      title={summary?.title ?? p.title}
      description={p.title}
      account={demo ? { name: app.wallet.name, address: demo.wallet.address } : undefined}
      rows={summary?.rows ?? []}
      network={NETWORK_NAME}
      networkLabel={p.network}
      fee={summary?.noFee ? undefined : feeText}
      feeLabel={p.fee}
      disclaimer={summary?.movesValue ? disclaimer : p.simulated}
      warning={summary?.movesValue}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      closeLabel={close}
    />
  )
}
