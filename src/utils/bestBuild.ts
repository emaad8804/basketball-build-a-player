import type { Group } from '../types'

export interface BestBuild {
  overall: number
  archetype: string
  legacyLabel: string
  group: Group
  champion: boolean
  date: string
}

const KEY = 'hooper-best-build'
const OLD_KEY = 'bap-best-build' // pre-rename key — migrated on first read

export function loadBestBuild(): BestBuild | null {
  try {
    const old = localStorage.getItem(OLD_KEY)
    if (old !== null && localStorage.getItem(KEY) === null) {
      localStorage.setItem(KEY, old)
    }
    if (old !== null) localStorage.removeItem(OLD_KEY)
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as BestBuild) : null
  } catch {
    return null
  }
}

/**
 * Save if this run beats the stored best (higher overall wins;
 * a championship breaks ties). Returns true if it became the new best.
 */
export function saveIfBest(candidate: BestBuild): boolean {
  const current = loadBestBuild()
  const beats =
    !current ||
    candidate.overall > current.overall ||
    (candidate.overall === current.overall &&
      candidate.champion &&
      !current.champion)
  if (beats) {
    try {
      localStorage.setItem(KEY, JSON.stringify(candidate))
    } catch {
      // Storage unavailable (private mode) — non-fatal
    }
  }
  return beats
}
