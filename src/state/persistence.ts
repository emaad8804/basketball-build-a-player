import type { GameState, Screen } from '../types'

/**
 * Mid-run persistence (critique P0): the target user plays in interruptible
 * moments — a backgrounded mobile tab IS a reload — so the in-progress run
 * is snapshotted to localStorage on every state change and offered back as
 * a resume on the landing screen. Versioned key: bump the suffix on any
 * breaking GameState shape change and stale saves are silently discarded.
 */
const KEY = 'hooper-run-v1'

const RESUMABLE_SCREENS: Screen[] = [
  'game', 'flaw', 'team', 'result', 'season', 'playin', 'playoffs', 'finals', 'share',
]

export function saveRun(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable/full (private mode) — the run just won't resume
  }
}

export function loadRun(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    // Minimal shape check — anything off means an old/foreign save
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !RESUMABLE_SCREENS.includes(parsed.screen) ||
      !parsed.group ||
      typeof parsed.runSeed !== 'number' ||
      typeof parsed.lockedAttributes !== 'object'
    ) {
      return null
    }
    // Budget runs must carry their money fields or the HUD/pricing breaks
    if (
      parsed.mode === 'budget' &&
      (typeof parsed.budgetLeft !== 'number' || !parsed.budgetTier)
    ) {
      return null
    }
    // Saves from before Dream Build lack the rolled-player pool — default it
    // rather than rejecting so old runs still resume
    if (!Array.isArray(parsed.rolledPlayerNames)) {
      return { ...parsed, rolledPlayerNames: [] }
    }
    return parsed
  } catch {
    return null
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
