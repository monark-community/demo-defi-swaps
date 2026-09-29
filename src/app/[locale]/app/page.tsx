import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SwapView } from "@/components/demo/swap-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.app
  return pageMetadata(locale, "/app", m.title, m.description)
}

export default async function SwapPage({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <SwapView />
}
