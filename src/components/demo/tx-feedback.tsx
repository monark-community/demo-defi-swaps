"use client"

import { TxFeedback as MonarkTxFeedback } from "@/components/ui/tx-feedback"
import { t } from "@/i18n/t"
import type { TxState } from "@/lib/demo/types"
import { formatPercent } from "@/lib/format"

import { useAppCopy } from "./app-provider"

/**
 * One transaction's visible lifecycle (@monark/ui tx-feedback), fed from the
 * demo's transaction state and translated strings.
 */
export function TxFeedback({
  state,
  confirmedLabel,
  onRetry,
  onDismiss,
  toleranceBps = 50,
  className,
}: {
  state: TxState
  confirmedLabel?: string
  onRetry?: () => void
  onDismiss?: () => void
  toleranceBps?: number
  className?: string
}) {
  const { app, locale } = useAppCopy()
  const tx = app.tx

  return (
    <MonarkTxFeedback
      phase={state.phase}
      hash={state.hash}
      error={state.error}
      reasons={{
        rejected: tx.rejected,
        reverted: tx.reverted,
        slippage: t(tx.slippage, {
          move: formatPercent(state.move ?? 0, locale),
          tolerance: formatPercent(toleranceBps / 10_000, locale),
        }),
      }}
      onRetry={onRetry}
      onDismiss={onDismiss}
      signingLabel={tx.signing}
      pendingLabel={tx.pending}
      pendingStatusLabel={tx.pending}
      confirmedLabel={confirmedLabel ?? tx.confirmed}
      failedLabel={tx.failed}
      retryLabel={tx.retry}
      dismissLabel={tx.dismiss}
      className={className}
    />
  )
}
