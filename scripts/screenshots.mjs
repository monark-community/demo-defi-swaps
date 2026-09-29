// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3131   (in another terminal)
//        BASE_URL=http://localhost:3131 pnpm screenshots
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3131"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY // optional filter on the variant tag
const KEY = "fluidswap-demo-v1"

const widths = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme })
// French: home page and one key flow, both widths, light.
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light" })

const T = {
  en: { connect: "Connect wallet", confirm: "Confirm", reject: "Reject", pay: "You pay", swap: "Swap", controls: "Demo controls" },
  fr: { connect: "Connecter le portefeuille", confirm: "Confirmer", reject: "Refuser", pay: "Vous payez", swap: "Échanger", controls: "Contrôles de démo" },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: widths[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "no-preference",
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  page.on("pageerror", (e) => console.log("  ! page error:", e.message))
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  if (fullPage) {
    // Load lazy images before a full-page capture, then come back.
    const y = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    await page.evaluate((top) => window.scrollTo(0, top), y)
  }
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`, fullPage })
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`)
}

/** Fresh demo with the live market paused, so screenshots are stable. */
async function freshDemo(page, v) {
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  await page.evaluate((key) => localStorage.removeItem(key), KEY)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(300)
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key))
    s.settings.liveMarket = false
    localStorage.setItem(key, JSON.stringify(s))
  }, KEY)
  await page.reload({ waitUntil: "networkidle" })
}

async function setSetting(page, patch) {
  await page.evaluate(
    ([key, p]) => {
      const s = JSON.parse(localStorage.getItem(key))
      Object.assign(s.settings, p)
      localStorage.setItem(key, JSON.stringify(s))
    },
    [KEY, patch]
  )
  await page.reload({ waitUntil: "networkidle" })
}

async function connect(page, v, capture) {
  const t = T[v.locale]
  const btn = page.getByRole("main").getByRole("button", { name: t.connect, exact: true })
  await btn.click()
  const dialog = page.getByRole("dialog")
  await dialog.waitFor()
  if (capture) await shot(page, v, "flow1-connect-prompt")
  await dialog.getByRole("button", { name: t.confirm }).click()
  await page.getByRole("main").getByRole("button", { name: t.connect, exact: true }).waitFor({ state: "detached", timeout: 10000 })
}

async function marketing(page, v) {
  for (const [name, path] of [
    ["home", ""],
    ["how-it-works", "/how-it-works"],
    ["credits", "/credits"],
    ["pricing", "/pricing"],
    ["404", "/this-page-does-not-exist"],
  ]) {
    await page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)
    await shot(page, v, `page-${name}`, true)
  }
  if (v.w < 768) {
    await page.goto(`${BASE}/${v.locale}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Open menu" }).click()
    await page.getByRole("dialog").waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function payField(page, v) {
  return page.getByLabel(T[v.locale].pay, { exact: true })
}

async function chooseToken(page, side, symbol) {
  await page.locator(`#swap-${side}-token`).click()
  await page.getByRole("option", { name: new RegExp(`^${symbol}\\b`) }).click()
}

async function appFlows(page, v) {
  await freshDemo(page, v)
  await shot(page, v, "app-01-swap-disconnected", true)

  // Flow 1: connect, rejected first
  await page.getByRole("main").getByRole("button", { name: "Connect wallet", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Reject" }).click()
  await page.getByText("You declined the sign-in request").first().waitFor().catch(() => {})
  await connect(page, v, true)
  await page.getByRole("button", { name: /Balances/ }).click()
  await page.getByRole("dialog").waitFor()
  await page.getByRole("dialog").getByRole("button", { name: "Get test tokens" }).click()
  await page.getByRole("dialog", { name: /Get test tokens/ }).getByRole("button", { name: "Confirm" }).click()
  await page.getByRole("dialog").getByText("Test tokens received").first().waitFor({ timeout: 10000 })
  await shot(page, v, "flow1-faucet")
  await page.keyboard.press("Escape")

  // Flow 2: swap with a full quote
  const pay = await payField(page, v)
  await pay.fill("1.5")
  await page.waitForTimeout(600)
  await shot(page, v, "flow2-quote", true)
  await page.getByRole("main").getByRole("button", { name: "Swap", exact: true }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-prompt")
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText("Waiting for the network…").first().waitFor()
  await page.waitForTimeout(500)
  await shot(page, v, "flow2-pending", v.w >= 768)
  await page.getByText(/Swapped .* for/).first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(400)
  await shot(page, v, "flow2-confirmed", true)

  // High impact in the thin pool, with the acknowledgement
  await pay.fill("150")
  await page.waitForTimeout(600)
  await shot(page, v, "flow2-high-impact", true)

  // Slippage failure: the market moves during the swap
  await setSetting(page, { marketMove: true })
  await (await payField(page, v)).fill("2")
  await page.getByRole("main").getByRole("button", { name: "Swap", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText(/Another trade moved the price/).first().waitFor({ timeout: 10000 })
  await page.getByText(/Another trade moved the price/).first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow2-slippage-failed")

  // Multi-hop route
  await chooseToken(page, "from", "tWBTC")
  await chooseToken(page, "to", "tDAI")
  await (await payField(page, v)).fill("0.05")
  await page.waitForTimeout(600)
  await shot(page, v, "flow2-multihop", true)

  // Pools
  await page.goto(`${BASE}/${v.locale}/app/pools`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "app-02-pools", true)

  // Flow 3: add liquidity
  await page.goto(`${BASE}/${v.locale}/app/pools/eth-usdc`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow3-pool", true)
  await page.getByLabel("tETH amount").fill("0.5")
  await page.waitForTimeout(300)
  await page.getByRole("button", { name: "Add liquidity", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText("Waiting for the network…").first().waitFor()
  await page.getByText("Waiting for the network…").first().scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-add-pending")
  await page.getByText(/Added liquidity to/).first().waitFor({ timeout: 10000 })
  await page.getByRole("heading", { name: "Your position" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow3-add-confirmed")

  // Flow 4: withdraw
  await page.getByRole("tab", { name: "Remove" }).click()
  await page.getByRole("button", { name: "50%", exact: true }).click().catch(() => {})
  await page.getByRole("tab", { name: "Remove" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow4-remove")
  await page.getByRole("button", { name: "Remove liquidity" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText(/Withdrew /).first().waitFor({ timeout: 10000 })
  await shot(page, v, "flow4-removed")

  // Flow 3b: create a pool
  await page.goto(`${BASE}/${v.locale}/app/pools/link-dai`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.getByLabel("tLINK amount").fill("100")
  await page.getByRole("button", { name: "Use the reference price" }).click()
  await page.getByLabel("tDAI amount").fill("1600")
  await page.waitForTimeout(300)
  await shot(page, v, "flow3-create-pool", true)
  await page.getByRole("button", { name: "Create pool" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText(/Pool .* created/).first().waitFor({ timeout: 10000 })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.waitForTimeout(400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow3-pool-created", true)

  // Flow 5: fee vote
  await page.goto(`${BASE}/${v.locale}/app/pools/link-usdc`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { name: "Fee vote" }).waitFor()
  await page.getByRole("heading", { name: "Fee vote" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-vote-open")
  await page.getByRole("button", { name: "Vote for" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click()
  await page.getByText(/You voted for/).waitFor({ timeout: 10000 })
  await page.waitForTimeout(700)
  await page.getByRole("heading", { name: "Fee vote" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-voted")
  await page.getByRole("button", { name: "End the vote now (demo)" }).click()
  await page.getByText(/Passed, fee is now/).waitFor()
  await page.getByRole("heading", { name: "Fee vote" }).scrollIntoViewIfNeeded()
  await shot(page, v, "flow5-passed")

  // Activity
  await page.goto(`${BASE}/${v.locale}/app/activity`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "app-03-activity", true)
  await page.getByRole("button", { name: "Failed", exact: true }).click()
  await shot(page, v, "app-03-activity-failed")

  // Demo controls
  await page.getByRole("button", { name: "Demo controls" }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "app-04-demo-controls")
  await page.keyboard.press("Escape")
}

async function frenchFlow(page, v) {
  const t = T.fr
  await page.goto(`${BASE}/fr`, { waitUntil: "networkidle" })
  await page.waitForTimeout(500)
  await shot(page, v, "page-home", true)
  await freshDemo(page, v)
  await connect(page, v, false)
  await (await payField(page, v)).fill("1,5")
  await page.waitForTimeout(600)
  await shot(page, v, "flow2-quote", true)
  await page.getByRole("main").getByRole("button", { name: t.swap, exact: true }).click()
  await page.getByRole("dialog").waitFor()
  await shot(page, v, "flow2-prompt")
  await page.getByRole("dialog").getByRole("button", { name: t.confirm }).click()
  await page.getByText(/échangés contre/).first().waitFor({ timeout: 10000 })
  await page.waitForTimeout(400)
  await shot(page, v, "flow2-confirmed", true)
  await page.goto(`${BASE}/fr/app/pools/link-usdc`, { waitUntil: "networkidle" })
  await page.getByRole("heading", { level: 1 }).waitFor()
  await shot(page, v, "flow5-pool", true)
}

const browser = await chromium.launch()
await mkdir(OUT, { recursive: true })
for (const v of variants) {
  const tag = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !tag.includes(ONLY)) continue
  console.log(tag)
  const { context, page } = await newPage(browser, v)
  try {
    if (v.locale === "fr") await frenchFlow(page, v)
    else {
      await marketing(page, v)
      await appFlows(page, v)
    }
  } catch (e) {
    console.error("  ✗", tag, e.message)
    await page.screenshot({ path: `${OUT}_error-${tag}.png` }).catch(() => {})
    process.exitCode = 1
  }
  await context.close()
}
await browser.close()
