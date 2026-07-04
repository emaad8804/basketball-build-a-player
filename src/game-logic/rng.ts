/** A [0, 1) random source, same shape as Math.random. */
export type Rand = () => number

/** mulberry32 — tiny fast seedable PRNG, plenty for game spins. */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit string hash. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export type RngEventType = 'team' | 'player' | 'riskit' | 'flaw'

/**
 * Fresh PRNG for one semantic event, keyed by (seed, type, counter).
 * The Nth team deal / player spin / risk-it / flaw spin is identical for
 * every run sharing a seed, no matter how much randomness other events
 * consumed in between — this is what makes Daily runs comparable across
 * players who made different choices.
 */
export function eventRng(
  seed: number,
  eventType: RngEventType,
  counter: number,
): Rand {
  return mulberry32(seed ^ hashString(`${eventType}:${counter}`))
}

/** Per-event spin counters tracked in game state. */
export interface RngCounters {
  team: number
  player: number
  riskit: number
  flaw: number
}

export const zeroRngCounters = (): RngCounters => ({
  team: 0,
  player: 0,
  riskit: 0,
  flaw: 0,
})

/** Unpredictable seed for free-play runs. */
export function randomSeed(): number {
  return (Math.random() * 4294967296) >>> 0
}
