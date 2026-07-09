import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../utils/motion'

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Count a number up on reveal: from 0 when the component mounts, then from
 * the previously displayed value on each `target` change (~800ms ease-out —
 * fits inside the autoTicker's 1500ms cadence). Renders the target instantly
 * when disabled or reduced motion is on.
 */
export function useCountUp(target: number, enabled = true, duration = 800): number {
  // Initializer runs once; later target changes re-check reduced motion
  // live in the effect.
  const [value, setValue] = useState(() =>
    enabled && !prefersReducedMotion() ? 0 : target,
  )
  const displayed = useRef(value)

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || displayed.current === target) {
      displayed.current = target
      setValue(target)
      return
    }
    const from = displayed.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const v = Math.round(from + (target - from) * EASE_OUT_CUBIC(t))
      displayed.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled, duration])

  return value
}
