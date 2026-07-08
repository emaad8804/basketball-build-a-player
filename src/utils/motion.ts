/**
 * Live check — users can flip the OS setting mid-session, so callers read
 * it at interaction time rather than caching at module load.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
