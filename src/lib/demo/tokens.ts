import type { Token, TokenSymbol } from "./types"

/** Testnet tokens and reference prices shared with the Monark DeFi demos. */
export const TOKENS: Record<TokenSymbol, Token> = {
  tETH: { symbol: "tETH", decimals: 18, usd: 3200, color: "#4a4760", letter: "E" },
  tWBTC: { symbol: "tWBTC", decimals: 8, usd: 64000, color: "#a34a0a", letter: "B" },
  tUSDC: { symbol: "tUSDC", decimals: 6, usd: 1, color: "#2c6a84", letter: "U" },
  tDAI: { symbol: "tDAI", decimals: 18, usd: 1, color: "#7d6418", letter: "D" },
  tLINK: { symbol: "tLINK", decimals: 18, usd: 14.5, color: "#6a4a78", letter: "L" },
}

export const TOKEN_LIST: TokenSymbol[] = ["tETH", "tWBTC", "tUSDC", "tDAI", "tLINK"]

export const NETWORK_NAME = "Sepolia testnet"

/** Every pair the demo knows, with its pool id and base/quote order. Five start with a pool. */
export const PAIRS: { id: string; a: TokenSymbol; b: TokenSymbol }[] = [
  { id: "eth-usdc", a: "tETH", b: "tUSDC" },
  { id: "wbtc-eth", a: "tWBTC", b: "tETH" },
  { id: "usdc-dai", a: "tUSDC", b: "tDAI" },
  { id: "link-eth", a: "tLINK", b: "tETH" },
  { id: "link-usdc", a: "tLINK", b: "tUSDC" },
  { id: "eth-dai", a: "tETH", b: "tDAI" },
  { id: "wbtc-usdc", a: "tWBTC", b: "tUSDC" },
  { id: "wbtc-dai", a: "tWBTC", b: "tDAI" },
  { id: "wbtc-link", a: "tWBTC", b: "tLINK" },
  { id: "link-dai", a: "tLINK", b: "tDAI" },
]

export function pairById(id: string) {
  return PAIRS.find((p) => p.id === id) ?? null
}

export function pairFor(x: TokenSymbol, y: TokenSymbol) {
  return PAIRS.find((p) => (p.a === x && p.b === y) || (p.a === y && p.b === x)) ?? null
}

/** Fee tiers a pool can use. */
export const FEE_TIERS = [0.0005, 0.003, 0.01] as const

/** Parse a user-typed decimal ("1 250,5", "1250.50"). Returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s  _]/g, "").replace(",", ".")
  if (!cleaned) return null
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** A float in token units to integer base units (for the registry `token-amount`). */
export function toBaseUnits(amount: number, symbol: TokenSymbol): string {
  const { decimals } = TOKENS[symbol]
  const negative = amount < 0
  const abs = Math.abs(amount)
  const fixed = abs.toFixed(Math.min(decimals, 12))
  const [w = "0", f = ""] = fixed.split(".")
  const units = BigInt(w) * 10n ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals) || "0")
  return (negative ? -units : units).toString()
}

export function usdOf(amount: number, symbol: TokenSymbol): number {
  return amount * TOKENS[symbol].usd
}

/** How many fraction digits make an amount readable without noise. */
export function fractionDigitsFor(amount: number, symbol: TokenSymbol): number {
  const abs = Math.abs(amount)
  if (abs === 0) return 2
  if (symbol === "tWBTC") return abs >= 1 ? 4 : 6
  if (abs >= 1000) return 2
  if (abs >= 1) return 4
  return 6
}

/** Plain string for an input field (no grouping), trimmed of trailing zeros. */
export function toInputString(amount: number, symbol: TokenSymbol): string {
  if (!Number.isFinite(amount) || amount <= 0) return ""
  const digits = Math.min(TOKENS[symbol].decimals, fractionDigitsFor(amount, symbol) + 2)
  return amount.toFixed(digits).replace(/\.?0+$/, "")
}
