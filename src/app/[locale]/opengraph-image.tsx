import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"

export const alt = "Fluidswap by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/** The pool's curve with a trade sliding along it, drawn flat. */
function curvePath(from: number, to: number) {
  const k = 60 * 60
  let d = ""
  for (let i = 0; i <= 40; i++) {
    const x = from + ((to - from) * i) / 40
    const y = k / x
    d += `${i ? "L" : "M"}${(x * 4).toFixed(1)},${(470 - y * 4).toFixed(1)}`
  }
  return d
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`
  // Points on x · y = 3600 (scaled ×4): now at x = 50, after at x = 72.
  const now = { x: 200, y: 470 - (3600 / 50) * 4 }
  const after = { x: 288, y: 470 - (3600 / 72) * 4 }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markSrc} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>Fluidswap</span>
              <span style={{ fontSize: 22, color: "#625952", marginTop: 6 }}>{d.common.byMonark}</span>
            </div>
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{d.meta.ogTagline}</div>
          <div style={{ fontSize: 22, color: "#625952" }}>{d.common.demoBadge}</div>
        </div>
        <svg width="400" height="486" viewBox="0 0 400 500" style={{ marginLeft: 20 }}>
          <line x1="10" y1="470" x2="390" y2="470" stroke="#E9DFD7" strokeWidth="3" />
          <line x1="10" y1="20" x2="10" y2="470" stroke="#E9DFD7" strokeWidth="3" />
          <path d={curvePath(32, 97)} fill="none" stroke="#857F7A" strokeWidth="4" />
          <line x1={now.x} y1={now.y} x2={after.x} y2={after.y} stroke="#15110E" strokeWidth="3" />
          <path d={curvePath(50, 72)} fill="none" stroke="#F88D10" strokeWidth="12" strokeLinecap="round" />
          <circle cx={now.x} cy={now.y} r="13" fill="#15110E" stroke="#FFFEFC" strokeWidth="4" />
          <circle cx={after.x} cy={after.y} r="18" fill="#F88D10" stroke="#FFFEFC" strokeWidth="5" />
        </svg>
      </div>
    ),
    size
  )
}
