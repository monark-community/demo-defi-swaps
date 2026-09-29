/**
 * Domain types for the Fluidswap demo. Everything the UI knows about pools,
 * positions, wallets and transactions goes through these shapes, so the
 * simulated layer in this folder could be replaced by wagmi/viem calls
 * (a Uniswap-v2-style router and pair contracts) without UI changes.
 *
 * Amounts are plain token units as JS numbers (1.5 = 1.5 tETH). Double
 * precision is ample for a teaching demo; a real integration would use the
 * contract's integer base units (bigint) and the same formulas.
 */

export type TokenSymbol = "tETH" | "tWBTC" | "tUSDC" | "tDAI" | "tLINK"

export interface Token {
  symbol: TokenSymbol
  decimals: number
  /** Reference price in USD shared by the Monark DeFi demos. */
  usd: number
  /** Flat colour of the lettered token disc. */
  color: string
  /** Letter shown in the disc. */
  letter: string
}

export interface PricePoint {
  /** ISO timestamp. */
  t: string
  /** Price of token A in token B (reserveB / reserveA). */
  p: number
}

export interface Trade {
  id: string
  at: string
  /** Trader address; `you` marks the visitor's own swaps. */
  trader: string
  you?: boolean
  tokenIn: TokenSymbol
  amountIn: number
  tokenOut: TokenSymbol
  amountOut: number
  hash: string
}

export type ProposalStatus = "open" | "passed" | "rejected"

export interface Proposal {
  id: string
  /** Proposed fee tier as a fraction (0.003 = 0.30 %). */
  newFee: number
  /** LP tokens voting for / against, excluding the visitor. */
  forLp: number
  againstLp: number
  /** Share of the LP supply that must vote (0.5 = 50 %). */
  quorum: number
  endsAt: string
  yourVote: "for" | "against" | null
  /** LP tokens the visitor voted with. */
  yourWeight: number
  status: ProposalStatus
}

export interface Pool {
  id: string
  a: TokenSymbol
  b: TokenSymbol
  reserveA: number
  reserveB: number
  /** Swap fee as a fraction (0.003 = 0.30 %). */
  fee: number
  lpSupply: number
  address: string
  createdAt: string
  createdByYou?: boolean
  volumeUsd24h: number
  feesUsd24h: number
  history: PricePoint[]
  trades: Trade[]
  proposal: Proposal | null
}

export interface Position {
  poolId: string
  lp: number
  /** Tokens deposited (net of withdrawals, pro rata) for the "vs holding" comparison. */
  depositedA: number
  depositedB: number
  openedAt: string
  /** Swap fees earned by this position, in USD. */
  feesUsd: number
}

export type TxError = "rejected" | "reverted" | "slippage"

export type ActivityKind = "swap" | "add" | "remove" | "create" | "vote" | "faucet"

export interface ActivityEntry {
  id: string
  at: string
  kind: ActivityKind
  status: "confirmed" | "failed"
  error?: TxError
  hash?: string
  poolId?: string
  /** Swap: route pool ids. */
  route?: string[]
  tokenIn?: TokenSymbol
  amountIn?: number
  tokenOut?: TokenSymbol
  amountOut?: number
  /** Liquidity: amounts of the pool's A and B tokens, and LP tokens minted or burned. */
  amountA?: number
  amountB?: number
  lp?: number
  /** Vote. */
  vote?: "for" | "against"
  /** Slippage failure: how far the price moved (fraction) and the tolerance (bps). */
  move?: number
  toleranceBps?: number
  /** USD value of the action, for analytics. */
  usd?: number
  /** Swap fees paid, in USD. */
  feeUsd?: number
}

export type WalletStatus = "disconnected" | "connecting" | "connected"

export interface WalletState {
  status: WalletStatus
  address: string
  lastError: "rejected" | null
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
  /** Another trader front-runs the next swap in the same direction. */
  marketMove: boolean
  /** Background trades from other traders. */
  liveMarket: boolean
  /** Slippage tolerance in basis points. */
  slippageBps: number
}

export interface DemoState {
  version: 1
  wallet: WalletState
  balances: Record<TokenSymbol, number>
  pools: Pool[]
  positions: Position[]
  activity: ActivityEntry[]
  settings: DemoSettings
}

/** Lifecycle of one simulated transaction, as the UI sees it. */
export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"

export interface TxState {
  phase: TxPhase
  hash?: string
  error?: TxError
  /** Extra detail for a slippage failure. */
  move?: number
}

export interface TxSummary {
  /** Short title, e.g. "Swap 1.5 tETH for tUSDC". */
  title: string
  rows?: { label: string; value: string }[]
  /** Transactions that move value show the testnet disclaimer. */
  movesValue: boolean
  /** Off-chain signature (sign-in): no network fee row. */
  noFee?: boolean
}
