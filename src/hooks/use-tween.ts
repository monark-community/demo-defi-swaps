"use client"

import { useEffect, useRef, useState } from "react"

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

/**
 * Smoothly follow a numeric target (ease-out). Used to slide the curve point
 * and the reserve bars; jumps straight to the target under reduced motion.
 */
export function useTween(target: number, duration = 250): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const current = useRef(target)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    if (prefersReducedMotion() || duration <= 0) {
      current.current = target
      // Defer to the next frame so the effect never sets state synchronously.
      const id = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(id)
    }
    from.current = current.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from.current + (target - from.current) * eased
      current.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
