"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { AppTabs } from "@/components/ui/app-tabs"
import { Disclaimer } from "@/components/ui/disclaimer"
import { href } from "@/i18n/config"
import { useStorageOk } from "@/lib/demo/store"

import { useAppCopy } from "./app-provider"
import { DemoControls } from "./demo-controls"
import { WalletSheet } from "./wallet-sheet"

/** The exchange's own bar: section tabs (Swap, Pools, Activity), balances and demo controls. */
export function AppFrame({ children }: { children: ReactNode }) {
  const { app, locale } = useAppCopy()
  const pathname = usePathname() ?? ""
  const storageOk = useStorageOk()
  const base = href(locale, "/app")

  return (
    <div className="flex flex-1 flex-col">
      <AppTabs
        tabs={[
          { href: base, label: app.tabs.swap, exact: true },
          { href: `${base}/pools`, label: app.tabs.pools },
          { href: `${base}/activity`, label: app.tabs.activity },
        ]}
        pathname={pathname}
        LinkComponent={Link}
        label={app.tabs.label}
        actions={
          <>
            <WalletSheet />
            <DemoControls />
          </>
        }
      />
      {!storageOk ? <Disclaimer variant="banner" role="status" text={app.controls.storage} /> : null}
      {children}
    </div>
  )
}
