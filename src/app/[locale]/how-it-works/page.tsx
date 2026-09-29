import { ArrowRightIcon, CheckIcon, ExternalLinkIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CurveExplorer } from "@/components/how/curve-explorer"
import { LpDiagram, RouteDiagram } from "@/components/how/diagrams"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale, REPO_URL } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { formatPercent, formatToken, formatUsd } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

import scaleImg from "../../../../public/images/scale.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how

  // Impermanent loss, worked through: 1 tETH + 3,200 tUSDC, then tETH +50 %.
  const r = 1.5
  const shareEth = 1 / Math.sqrt(r)
  const shareUsdc = 3200 * Math.sqrt(r)
  const priceAfter = 3200 * r
  const poolValue = shareEth * priceAfter + shareUsdc
  const holdValue = priceAfter + 3200
  const il = poolValue / holdValue - 1

  const toc = [
    { id: "rule", label: h.rule.title },
    { id: "impact", label: h.impact.title },
    { id: "lp", label: h.lp.title },
    { id: "routes", label: h.routes.title },
    { id: "votes", label: h.votes.title },
    { id: "dev", label: h.dev.title },
  ]

  return (
    <>
      <section className="border-b" aria-labelledby="how-title">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 lg:pt-16">
          <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
          <h1 id="how-title" className="mt-3 max-w-3xl text-4xl font-extrabold tracking-display sm:text-5xl">
            {h.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">{h.intro}</p>
          <nav aria-label={h.toc} className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* 1. The rule */}
      <section id="rule" className="scroll-mt-24" aria-labelledby="rule-title">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 id="rule-title" className="text-3xl font-bold tracking-display">
              {h.rule.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{h.rule.body}</p>
          </div>
          <div className="mt-8">
            <CurveExplorer
              locale={locale}
              labels={{
                ...h.rule.explorer,
                now: dict.home.hero.now,
                after: dict.home.hero.after,
                axisIn: dict.home.hero.axisX,
                axisOut: dict.home.hero.axisY,
                levels: dict.app.swap.levels,
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Impact vs slippage */}
      <section id="impact" className="scroll-mt-24 border-t bg-card/60" aria-labelledby="impact-title">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 id="impact-title" className="text-3xl font-bold tracking-display">
              {h.impact.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{h.impact.body}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { title: h.impact.impactTitle, items: h.impact.impactItems },
              { title: h.impact.slippageTitle, items: h.impact.slippageItems },
            ].map((col) => (
              <div key={col.title} className="rounded-3xl border bg-card p-6">
                <h3 className="text-xl font-bold">{col.title}</h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LPs */}
      <section id="lp" className="scroll-mt-24 border-t" aria-labelledby="lp-title">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 id="lp-title" className="text-3xl font-bold tracking-display">
              {h.lp.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{h.lp.body}</p>
          </div>
          <div className="mt-8">
            <LpDiagram labels={h.lp.diagram} />
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <h3 className="text-xl font-bold">{h.lp.ilTitle}</h3>
              <p className="mt-3 text-muted-foreground">{h.lp.ilBody}</p>
            </div>
            <dl className="divide-y rounded-3xl border bg-card text-sm">
              {[
                { label: h.lp.ilRows.deposit, value: `${formatToken(1, "tETH", locale)} + ${formatToken(3200, "tUSDC", locale, 0)}`, usd: formatUsd(6400, locale) },
                { label: h.lp.ilRows.pool, value: `${formatToken(shareEth, "tETH", locale, 3)} + ${formatToken(shareUsdc, "tUSDC", locale, 0)}`, usd: formatUsd(poolValue, locale) },
                { label: h.lp.ilRows.hold, value: `${formatToken(1, "tETH", locale)} + ${formatToken(3200, "tUSDC", locale, 0)}`, usd: formatUsd(holdValue, locale) },
              ].map((row) => (
                <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right">
                    <span className="block font-semibold tabular-nums">{row.value}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">{row.usd}</span>
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <dt className="font-bold">{h.lp.ilRows.loss}</dt>
                <dd className="font-extrabold text-destructive tabular-nums">
                  {formatPercent(il, locale, 1)} ({formatUsd(poolValue - holdValue, locale)})
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* 4. Routes + 5. Votes */}
      <section className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-14 sm:px-6 lg:py-16">
        <div id="routes" className="scroll-mt-24">
          <h2 className="text-3xl font-bold tracking-display">{h.routes.title}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{h.routes.body}</p>
          <div className="mt-6">
            <RouteDiagram label={h.routes.label} fee={formatPercent(0.003, locale)} />
          </div>
        </div>
        <div id="votes" className="scroll-mt-24 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-display">{h.votes.title}</h2>
          <p className="mt-3 text-muted-foreground">{h.votes.body}</p>
          <p className="mt-4 rounded-2xl border bg-card p-4 text-sm">{h.votes.tiers}</p>
          <Link
            href={href(locale, "/app/pools/link-usdc")}
            className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4"
          >
            {dict.home.demo.items[2]?.cta}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Analogy */}
      <section className="border-t bg-card/60" aria-labelledby="analogy-title">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center lg:py-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border">
            <Image src={scaleImg} alt={h.analogy.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-[50%_55%]" placeholder="blur" />
          </div>
          <div>
            <h2 id="analogy-title" className="text-3xl font-bold tracking-display">
              {h.analogy.title}
            </h2>
            <p className="mt-3 max-w-[52ch] text-lg text-muted-foreground">{h.analogy.body}</p>
          </div>
        </div>
      </section>

      {/* Developers */}
      <section id="dev" className="scroll-mt-24 border-t" aria-labelledby="dev-title">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 id="dev-title" className="text-3xl font-bold tracking-display">
              {h.dev.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{h.dev.body}</p>
          </div>
          <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-semibold">{h.dev.head.action}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">{h.dev.head.call}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {h.dev.rows.map((row) => (
                  <tr key={row.action} className="flex flex-col sm:table-row">
                    <th scope="row" className="px-5 pt-3.5 font-bold sm:py-3.5">{row.action}</th>
                    <td className="px-5 pt-1 pb-3.5 sm:py-3.5">
                      <code className="font-mono text-xs break-all text-foreground">{row.call}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">{h.dev.approvals}</p>
          <a href={REPO_URL} className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-primary-ink underline underline-offset-4">
            {h.dev.source}
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <SectionDivider />

      <section aria-labelledby="how-cta-title">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-16">
          <div>
            <h2 id="how-cta-title" className="text-3xl font-extrabold tracking-display">
              {h.cta.title}
            </h2>
            <p className="mt-2 text-muted-foreground">{h.cta.body}</p>
          </div>
          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.cta.button}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
