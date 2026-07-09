import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../utils/motion'

/**
 * Scrolls the element into view when `active` becomes true. The sim feeds
 * append games below the fold — without this, elimination drama plays to
 * an empty room. Reduced motion jumps instead of gliding.
 */
export function useRevealScroll<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    if (!active) return
    ref.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [active])
  return ref
}
