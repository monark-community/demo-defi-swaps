"use client"

import { RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"
import { useId } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"
import type { DemoSettings } from "@/lib/demo/types"

import { useAppCopy } from "./app-provider"

function Row({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div>
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-hint`} className="mt-1" />
    </div>
  )
}

/** Shape the simulation: slow blocks, forced failures, market moves, live market, reset. */
export function DemoControls() {
  const demo = useDemo()
  const { app, close } = useAppCopy()
  const c = app.controls
  const settings = demo?.settings
  const set = (patch: Partial<DemoSettings>) => setSettings(patch)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <SlidersHorizontalIcon aria-hidden="true" />
          <span className="hidden sm:inline">{c.open}</span>
          <span className="sr-only sm:hidden">{c.open}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel={close} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4 text-left">
          <SheetTitle className="text-base font-extrabold">{c.title}</SheetTitle>
          <SheetDescription>{c.description}</SheetDescription>
        </SheetHeader>
        {settings ? (
          <div className="flex-1 divide-y overflow-y-auto px-5">
            <Row label={c.slow} hint={c.slowHint} checked={settings.slow} onChange={(v) => set({ slow: v })} />
            <Row label={c.failNext} hint={c.failNextHint} checked={settings.failNext} onChange={(v) => set({ failNext: v })} />
            <Row label={c.marketMove} hint={c.marketMoveHint} checked={settings.marketMove} onChange={(v) => set({ marketMove: v })} />
            <Row label={c.liveMarket} hint={c.liveMarketHint} checked={settings.liveMarket} onChange={(v) => set({ liveMarket: v })} />
          </div>
        ) : null}
        <div className="border-t px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetDemo()
              toast.success(c.resetDone)
            }}
          >
            <RotateCcwIcon aria-hidden="true" />
            {c.reset}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
