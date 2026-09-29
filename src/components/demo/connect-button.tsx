"use client"

import { Loader2Icon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/store"
import { connectWallet } from "@/lib/demo/wallet"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/** Connect the simulated wallet (sign-in prompt), with the "declined" message on rejection. */
export function ConnectButton({ className, size = "default", label }: { className?: string; size?: "default" | "lg"; label?: string }) {
  const demo = useDemo()
  const { app } = useAppCopy()
  const w = app.wallet
  const connecting = demo?.wallet.status === "connecting"

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        size={size}
        disabled={!demo || connecting}
        onClick={() =>
          void connectWallet({
            title: w.signIn,
            rows: [{ label: w.signInRow, value: w.signInValue }],
            movesValue: false,
            noFee: true,
          })
        }
        className="w-full"
      >
        {connecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <WalletIcon aria-hidden="true" />}
        {connecting ? w.connecting : (label ?? w.connectDemo)}
      </Button>
      {demo?.wallet.lastError === "rejected" ? (
        <p role="alert" className="text-sm text-destructive">
          {w.rejected}
        </p>
      ) : null}
    </div>
  )
}
