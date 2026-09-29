import {
  ArrowRightIcon,
  ArrowUpDownIcon,
  DropletsIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  TerminalIcon,
  VoteIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { HeroCurve } from "@/components/home/hero-curve"
import { TwoPools } from "@/components/home/two-pools"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

import workshopImg from "../../../public/images/workshop.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, "/", null, getDictionary(locale).meta.description)
}

const DEMO_ICONS = [ArrowUpDownIcon, DropletsIcon, VoteIcon]
const DEMO_LINKS = ["/app", "/app/pools/eth-usdc", "/app/pools/link-usdc"]
const AUDIENCE_ICONS = [GraduationCapIcon, TerminalIcon, MegaphoneIcon]

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const levels = dict.app.swap.levels

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={569}
          height={571}
          unoptimized
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-44 w-[34rem] max-w-none opacity-[0.09] select-none sm:-right-28 lg:-top-24 lg:-right-24 lg:w-[48rem] dark:opacity-[0.15]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <h1 id="hero-title" className="text-[2.25rem] leading-[1.08] font-extrabold tracking-display sm:text-5xl lg:text-[3.6rem]">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
          <HeroCurve locale={locale} labels={{ ...h.hero, levels }} />
        </div>
      </section>

      {/* What you can do */}
      <section className="border-t bg-card/60" aria-labelledby="demo-title">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="demo-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.demo.title}
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {h.demo.items.map((item, i) => {
              const Icon = DEMO_ICONS[i] ?? ArrowUpDownIcon
              return (
                <li key={item.title}>
                  <Link
                    href={href(locale, DEMO_LINKS[i] ?? "/app")}
                    className="group flex h-full flex-col rounded-3xl border bg-card p-6 transition-colors hover:border-input"
                  >
                    <Icon className="size-6 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                    <p className="mt-1.5 flex-1 text-muted-foreground">{item.body}</p>
                    <ArrowRightIcon className="mt-4 size-5 text-primary-ink transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Same trade, two pools */}
      <section className="border-t" aria-labelledby="pools-title">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-14 lg:py-20">
          <div>
            <h2 id="pools-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.twoPools.title}
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">{h.twoPools.body}</p>
          </div>
          <TwoPools locale={locale} labels={{ ...h.twoPools, levels }} />
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t bg-card/60" aria-labelledby="who-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center lg:gap-16 lg:py-20">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border md:aspect-[4/5]">
            <Image
              src={workshopImg}
              alt={h.who.alt}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover object-[50%_40%]"
              placeholder="blur"
            />
          </div>
          <div>
            <h2 id="who-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.who.title}
            </h2>
            <ul className="mt-8 flex flex-col gap-5">
              {h.who.audiences.map((a, i) => {
                const Icon = AUDIENCE_ICONS[i] ?? GraduationCapIcon
                return (
                  <li key={a.title} className="flex gap-4">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-background">
                      <Icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-bold">{a.title}</span>
                      <span className="block text-muted-foreground">{a.body}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.faq.title}
          </h2>
          <div className="mt-8 divide-y rounded-3xl border bg-card">
            {h.faq.items.map((item) => (
              <details key={item.q} className="group px-5 sm:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-bold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[68ch] pb-5 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Closing */}
      <section aria-labelledby="closing-title">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-20">
          <h2 id="closing-title" className="text-3xl font-extrabold tracking-display sm:text-4xl">
            {h.closing.title}
          </h2>
          <Button asChild size="lg">
            <Link href={href(locale, "/app")}>
              {h.closing.cta}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
