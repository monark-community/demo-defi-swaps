"use client"

import { TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { href } from "@/i18n/config"
import { useStorageOk } from "@/lib/demo/store"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"
import { WalletSheet } from "./wallet-sheet"

/** The exchange's own bar: section tabs (Swap, Pools, Activity), balances and demo controls. */
export function AppFrame({ children }: { children: ReactNode }) {
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  const storageOk = useStorageOk()
  const base = href(locale, "/app")
  const tabs = [
    { href: base, label: app.tabs.swap, active: pathname === base },
    { href: `${base}/pools`, label: app.tabs.pools, active: pathname.startsWith(`${base}/pools`) },
    { href: `${base}/activity`, label: app.tabs.activity, active: pathname.startsWith(`${base}/activity`) },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6">
          <nav aria-label={app.tabs.label} className="min-w-0 flex-1">
            <ul className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
              {tabs.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={t.active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full px-3.5 text-sm font-bold transition-colors duration-150 sm:px-4",
                      t.active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <WalletSheet />
            <DemoControls />
          </div>
        </div>
      </div>
      {!storageOk ? (
        <div role="status" className="border-b bg-muted/60">
          <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm sm:px-6">
            <TriangleAlertIcon className="size-4 shrink-0 text-warning" aria-hidden="true" />
            {app.controls.storage}
          </p>
        </div>
      ) : null}
      {children}
    </div>
  )
}
