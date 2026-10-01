import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PoolView } from "@/components/demo/pool-view"
import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"
import { pairById, PAIRS } from "@/lib/demo/tokens"

/** Every pair is prerendered: pools that don't exist yet show the "create a pool" form. */
export function generateStaticParams() {
  return locales.flatMap((locale) => PAIRS.map((p) => ({ locale, id: p.id })))
}

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<"/[locale]/app/pools/[id]">): Promise<Metadata> {
  const { locale, id } = await params
  const pair = pairById(id)
  if (!isLocale(locale) || !pair) return {}
  const m = getDictionary(locale).meta.pages.pool
  return pageMetadata(locale, `/app/pools/${id}`, `${pair.a}/${pair.b}`, m.description)
}

export default async function PoolPage({ params }: PageProps<"/[locale]/app/pools/[id]">) {
  const { locale, id } = await params
  if (!isLocale(locale) || !pairById(id)) notFound()
  return <PoolView id={id} />
}
