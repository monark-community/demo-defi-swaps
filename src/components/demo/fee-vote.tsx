"use client"

import { CheckCircle2Icon, GavelIcon, ThumbsDownIcon, ThumbsUpIcon, XCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { useTween } from "@/hooks/use-tween"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { endVote, logFailure, settleVote, tally } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import type { Pool } from "@/lib/demo/types"
import { formatDateTime, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { TxFeedback } from "./tx-feedback"

/** LP-weighted fee vote: the tally bar reflows as your weight lands, then the result is stamped. */
export function FeeVote({ pool }: { pool: Pool }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const v = app.pool.vote
  const tx = useTx()
  const proposal = pool.proposal
  const result = tally(pool)
  const position = demo?.positions.find((x) => x.poolId === pool.id)
  const connected = demo?.wallet.status === "connected"
  const forW = useTween((result?.for ?? 0) * 100, 600)
  const againstW = useTween((result?.against ?? 0) * 100, 600)
  if (!proposal || !result) return null

  const yourShare = position ? position.lp / pool.lpSupply : 0
  const pair = `${pool.a}/${pool.b}`
  const open = proposal.status === "open"
  const fee = (x: number) => formatPercent(x, locale)

  const cast = async (choice: "for" | "against") => {
    await tx.run(
      {
        title: t(v.summary, { choice: v.choice[choice], pair }),
        rows: [
          { label: v.rowProposal, value: t(v.proposal, { from: fee(proposal.fromFee), to: fee(proposal.newFee) }) },
          { label: v.rowWeight, value: formatPercent(yourShare, locale) },
        ],
        movesValue: false,
      },
      {
        apply: (hash) => settleVote(pool.id, choice, hash),
        onFail: (error, hash) => logFailure({ kind: "vote", error, hash, poolId: pool.id, vote: choice }),
      }
    )
  }

  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6" aria-labelledby="vote-title">
      <div className="flex items-center gap-2">
        <GavelIcon className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <h2 id="vote-title" className="text-lg font-extrabold">
          {v.title}
        </h2>
      </div>
      <p className="mt-3 flex items-center gap-1 text-base font-bold">
        {t(v.proposal, { from: fee(proposal.fromFee), to: fee(proposal.newFee) })}
        <InfoTip label={v.whyLabel}>{v.why}</InfoTip>
      </p>
      {open ? <p className="mt-2 text-xs text-muted-foreground">{t(v.ends, { when: formatDateTime(proposal.endsAt, locale) })}</p> : null}

      {/* Tally */}
      <div className="mt-5">
        <div className="relative h-4 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="fs-hatch absolute inset-0 opacity-60" />
          <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${forW}%` }} />
          <div className="absolute inset-y-0 bg-chart-3" style={{ left: `${forW}%`, width: `${againstW}%` }} />
          {/* Quorum marker */}
          <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${proposal.quorum * 100}%` }} />
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <li className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
              {v.for}
            </span>
            <span className="font-extrabold tabular-nums">{formatPercent(result.for, locale)}</span>
          </li>
          <li className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-full bg-chart-3" aria-hidden="true" />
              {v.against}
            </span>
            <span className="font-extrabold tabular-nums">{formatPercent(result.against, locale)}</span>
          </li>
          <li className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="fs-hatch size-2.5 rounded-full" aria-hidden="true" />
              {v.notVoted}
            </span>
            <span className="font-extrabold tabular-nums">{formatPercent(Math.max(0, 1 - result.turnout), locale)}</span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(v.quorum, { pct: formatPercent(proposal.quorum, locale, 0) })} ·{" "}
          <span className={cn("font-semibold", result.quorumReached ? "text-success" : "text-warning")}>
            {result.quorumReached ? v.quorumReached : v.quorumMissing}
          </span>
        </p>
      </div>

      {/* Result or actions */}
      {!open ? (
        <p
          role="status"
          className={cn(
            "fs-stamp mt-5 flex items-center gap-2 rounded-2xl border-2 px-4 py-3 font-extrabold",
            proposal.status === "passed" ? "border-success text-success" : "border-chart-3 text-foreground"
          )}
        >
          {proposal.status === "passed" ? <CheckCircle2Icon className="size-5" aria-hidden="true" /> : <XCircleIcon className="size-5" aria-hidden="true" />}
          {proposal.status === "passed" ? t(v.passed, { fee: fee(pool.fee) }) : t(v.rejected, { fee: fee(pool.fee) })}
        </p>
      ) : !connected || !position ? (
        <p className="mt-5 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">{v.onlyLps}</p>
      ) : proposal.yourVote ? (
        <div className="mt-5 flex flex-col gap-3">
          <p className="fs-fade-up rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold">
            {t(v.voted, { choice: v.choice[proposal.yourVote], pct: formatPercent(proposal.yourWeight / pool.lpSupply, locale) })}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              endVote(pool.id)
            }}
          >
            {v.end}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-bold">{t(v.weight, { pct: formatPercent(yourShare, locale) })}</span>{" "}
            <span className="text-muted-foreground">{v.decides}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => cast("for")} disabled={tx.busy}>
              <ThumbsUpIcon aria-hidden="true" />
              {v.voteFor}
            </Button>
            <Button variant="outline" onClick={() => cast("against")} disabled={tx.busy}>
              <ThumbsDownIcon aria-hidden="true" />
              {v.voteAgainst}
            </Button>
          </div>
          <TxFeedback state={tx.state} onDismiss={tx.reset} />
        </div>
      )}
    </section>
  )
}
