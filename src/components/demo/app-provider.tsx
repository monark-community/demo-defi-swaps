"use client"

import { useTheme } from "next-themes"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { marketTick } from "@/lib/demo/ops"
import { getDemo, initDemo } from "@/lib/demo/store"

import { WalletPrompt } from "./wallet-prompt"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  tokens: Dictionary["tokens"]
  disclaimer: string
  demoBadge: string
  close: string
}

const AppContext = createContext<AppCopy | null>(null)

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

/** Other traders swapping in the background while the exchange is open (and the tab visible). */
function useLiveMarket() {
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        const demo = getDemo()
        if (demo?.settings.liveMarket && document.visibilityState === "visible") marketTick()
        schedule()
      }, 6000 + Math.random() * 5000)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    initDemo()
  }, [])
  useLiveMarket()

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletPrompt />
      <Toaster
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        // Every transaction reports inline, next to the button that started it;
        // toasts are only for results whose panel goes away (pool created,
        // position closed, demo reset). Bottom-left keeps them off the right-hand
        // panels (position, vote, sheets) where those results are shown.
        position="bottom-left"
        offset={{ bottom: 24, left: 24 }}
        mobileOffset={{ bottom: 16, left: 16, right: 16 }}
        closeButton
        toastOptions={{
          closeButton: true,
          classNames: {
            toast: "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-md",
            description: "!text-muted-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}
