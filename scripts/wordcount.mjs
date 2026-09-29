// Word counts per page (English), for the simplification pass.
// Usage: pnpm build && pnpm start -p 3131   (in another terminal)
//        node scripts/wordcount.mjs          (BASE_URL defaults to http://localhost:3131)
// Prints a Markdown table:
//   visible = words in <main> a visitor can read without opening anything (innerText)
//   total   = every word in <main>, including closed disclosures, FAQ answers, tooltips' text nodes
//   chrome  = visible words outside <main> (header, app bar, footer)
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3131"
const STORE = "fluidswap-demo-v1"

async function measure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main")
    const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) ?? []).length
    const all = []
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest("script,style,svg") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    while (walker.nextNode()) all.push(walker.currentNode.nodeValue)
    const visible = words(main.innerText)
    const total = words(all.join(" "))
    const chrome = words(document.body.innerText) - visible
    return { visible, total, chrome }
  })
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-CA" })
const page = await context.newPage()
const rows = []

async function run(name, path, before) {
  if (path) await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" })
  if (before) await before()
  await page.waitForTimeout(600)
  rows.push({ name, ...(await measure(page)) })
}

for (const [name, path] of [
  ["Home", "/en"],
  ["How it works", "/en/how-it-works"],
  ["Credits", "/en/credits"],
  ["404", "/en/this-page-does-not-exist"],
]) await run(name, path)

// Fresh demo, live market paused so the counts are stable.
await page.goto(`${BASE}/en/app`, { waitUntil: "networkidle" })
await page.evaluate((key) => localStorage.removeItem(key), STORE)
await page.reload({ waitUntil: "networkidle" })
await page.waitForTimeout(300)
await page.evaluate((key) => {
  const s = JSON.parse(localStorage.getItem(key))
  s.settings.liveMarket = false
  localStorage.setItem(key, JSON.stringify(s))
}, STORE)
await run("App: swap (no wallet)", "/en/app")
await page.getByRole("main").getByRole("button", { name: "Connect wallet", exact: true }).click()
await page.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click()
await page.getByRole("main").getByRole("button", { name: "Connect wallet", exact: true }).waitFor({ state: "detached", timeout: 10000 })
await run("App: swap quote (1.5 tETH)", null, async () => {
  await page.getByLabel("You pay", { exact: true }).fill("1.5")
})
await page.getByRole("main").getByRole("button", { name: "Swap", exact: true }).click()
await page.getByRole("dialog").getByRole("button", { name: "Confirm", exact: true }).click()
await page.getByText(/Swapped .* for/).first().waitFor({ timeout: 10000 })
await run("App: pools", "/en/app/pools")
await run("App: pool tETH/tUSDC", "/en/app/pools/eth-usdc")
await run("App: pool tLINK/tUSDC (vote)", "/en/app/pools/link-usdc")
await run("App: create pool tLINK/tDAI", "/en/app/pools/link-dai")
await run("App: activity", "/en/app/activity")

await browser.close()

const sum = (k) => rows.reduce((s, r) => s + r[k], 0)
console.log("| Page | Visible in main | Total in main (incl. collapsed) | Chrome (header, app bar, footer) |")
console.log("|-|-:|-:|-:|")
for (const r of rows) console.log(`| ${r.name} | ${r.visible} | ${r.total} | ${r.chrome} |`)
console.log(`| **Total** | **${sum("visible")}** | **${sum("total")}** | **${sum("chrome")}** |`)
