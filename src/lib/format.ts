import { intlLocale, type Locale } from "@/i18n/config"
import { fractionDigitsFor } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"

/** Locale-aware formatting. Every visible number goes through here or the registry `token-amount`. */

export function formatAmount(amount: number, symbol: TokenSymbol, locale: Locale, digits?: number): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    maximumFractionDigits: digits ?? fractionDigitsFor(amount, symbol),
  }).format(amount)
}

export function formatToken(amount: number, symbol: TokenSymbol, locale: Locale, digits?: number): string {
  return `${formatAmount(amount, symbol, locale, digits)} ${symbol}`
}

export function formatUsd(amount: number, locale: Locale, opts: { compact?: boolean } = {}): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 2 : 2,
    minimumFractionDigits: opts.compact ? 0 : 2,
  }).format(amount)
}

/** Percentages: two decimals by default (Monark DeFi family convention for APY/APR). */
export function formatPercent(fraction: number, locale: Locale, digits = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction)
}

export function formatNumber(n: number, locale: Locale, maxFrac = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: maxFrac }).format(n)
}

/** Price with enough significant digits whatever its size (0.004531 or 64,000). */
export function formatPrice(n: number, locale: Locale): string {
  const abs = Math.abs(n)
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 5 : 7
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(n)
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium" }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

export function formatShortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { month: "short", day: "numeric" }).format(new Date(iso))
}

/** "4 min ago", "il y a 2 j". */
export function formatRelative(iso: string, locale: Locale, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto", style: "short" })
  const abs = Math.abs(diff)
  if (abs < 45) return rtf.format(Math.round(diff), "second")
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour")
  return rtf.format(Math.round(diff / 86400), "day")
}

export function shortHash(hash: string, start = 8, end = 6): string {
  return hash.length > start + end + 1 ? `${hash.slice(0, start)}…${hash.slice(-end)}` : hash
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
