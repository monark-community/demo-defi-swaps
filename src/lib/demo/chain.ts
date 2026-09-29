"use client"

import { useCallback, useRef, useState } from "react"

import { randomHash } from "./ids"
import { getDemo, requestSignature, setSettings } from "./store"
import type { TxError, TxState, TxSummary } from "./types"

/**
 * Simulated chain. A transaction is: wallet prompt (sign or reject) ->
 * pending with a hash for a realistic block time -> confirmed or failed.
 * "Fail the next transaction" in the demo controls forces one revert; a swap
 * can also fail on its own when the price moved beyond the slippage tolerance.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function blockTime(): number {
  const slow = getDemo()?.settings.slow
  const [min, max] = slow ? [3000, 6000] : [1200, 2400]
  return Math.round(min + Math.random() * (max - min))
}

/** Estimated network fee shown in the wallet prompt (simulated, in tETH). */
export function estimateFee(): number {
  return 0.00018 + Math.random() * 0.00016
}

/** What a transaction does when its block lands: nothing returned means success. */
export type Apply = (hash: string) => { error: TxError; move?: number } | void

export interface RunOptions {
  apply: Apply
  /** Called when the transaction fails (rejected, reverted or slippage). */
  onFail?: (error: TxError, hash: string | undefined, move?: number) => void
}

/** One transaction's lifecycle for a component. */
export function useTx() {
  const [state, setState] = useState<TxState>({ phase: "idle" })
  const busy = useRef(false)

  const run = useCallback(async (summary: TxSummary, { apply, onFail }: RunOptions) => {
    if (busy.current) return false
    busy.current = true
    try {
      setState({ phase: "signing" })
      const ok = await requestSignature(summary)
      if (!ok) {
        setState({ phase: "failed", error: "rejected" })
        onFail?.("rejected", undefined)
        return false
      }
      const hash = randomHash()
      setState({ phase: "pending", hash })
      await sleep(blockTime())
      if (getDemo()?.settings.failNext) {
        setSettings({ failNext: false })
        setState({ phase: "failed", hash, error: "reverted" })
        onFail?.("reverted", hash)
        return false
      }
      const result = apply(hash)
      if (result) {
        setState({ phase: "failed", hash, error: result.error, move: result.move })
        onFail?.(result.error, hash, result.move)
        return false
      }
      setState({ phase: "confirmed", hash })
      return true
    } finally {
      busy.current = false
    }
  }, [])

  const reset = useCallback(() => setState({ phase: "idle" }), [])

  return { state, run, reset, busy: state.phase === "signing" || state.phase === "pending" }
}
