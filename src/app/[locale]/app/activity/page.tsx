import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ActivityView } from "@/components/demo/activity-view"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/activity">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.activity
  return pageMetadata(locale, "/app/activity", m.title, m.description)
}

export default async function ActivityPage({ params }: PageProps<"/[locale]/app/activity">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <ActivityView />
}
