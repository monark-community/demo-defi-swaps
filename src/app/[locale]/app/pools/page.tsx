import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PoolsView } from "@/components/demo/pools-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/pools">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.pools
  return pageMetadata(locale, "/app/pools", m.title, m.description)
}

export default async function PoolsPage({ params }: PageProps<"/[locale]/app/pools">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <PoolsView />
}
