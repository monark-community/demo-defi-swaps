"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DemoControls as MonarkDemoControls, DemoControlsToggle } from "@/components/ui/demo-controls"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"

import { useAppCopy } from "./app-provider"

/** Shape the simulation: slow blocks, forced failures, market moves, live market, reset. */
export function DemoControls() {
  const demo = useDemo()
  const { app, close } = useAppCopy()
  const c = app.controls
  const settings = demo?.settings

  return (
    <MonarkDemoControls
      trigger={
        <Button variant="outline">
          <SlidersHorizontalIcon aria-hidden="true" />
          <span className="hidden sm:inline">{c.open}</span>
          <span className="sr-only sm:hidden">{c.open}</span>
        </Button>
      }
      slow={settings?.slow ?? false}
      onSlowChange={(slow) => setSettings({ slow })}
      failNext={settings?.failNext ?? false}
      onFailNextChange={(failNext) => setSettings({ failNext })}
      onReset={() => {
        resetDemo()
        toast.success(c.resetDone)
      }}
      title={c.title}
      openLabel={c.open}
      slowLabel={c.slow}
      slowHint={c.slowHint}
      failNextLabel={c.failNext}
      failNextHint={c.failNextHint}
      resetLabel={c.reset}
      resetHint={c.resetHint}
      resetConfirmTitle={c.resetConfirmTitle}
      resetConfirmBody={c.resetConfirmBody}
      resetConfirmLabel={c.resetConfirmLabel}
      cancelLabel={c.cancel}
      closeLabel={close}
    >
      <DemoControlsToggle
        label={c.marketMove}
        hint={c.marketMoveHint}
        checked={settings?.marketMove ?? false}
        onCheckedChange={(marketMove) => setSettings({ marketMove })}
      />
      <DemoControlsToggle
        label={c.liveMarket}
        hint={c.liveMarketHint}
        checked={settings?.liveMarket ?? false}
        onCheckedChange={(liveMarket) => setSettings({ liveMarket })}
      />
    </MonarkDemoControls>
  )
}
