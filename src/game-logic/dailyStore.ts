import type { FlawId } from '../constants/flaws'
import type { Group, Rarity } from '../types'
import { dailyNumber, todayKey } from './daily'

/** One finished official daily run, locked into localStorage history. */
export interface DailyRecord {
  dateKey: string
  dayNumber: number
  group: Group
  overall: number
  archetype: string
  legacyLabel: string
  /** Rarity of the player locked into each slot, in ATTRIBUTE_KEYS order. */
  raritySquares: Rarity[]
  flawId: FlawId | null
  flawRerolled: boolean
  /** Had a Respin still banked when the run ended. */
  respinSaved: boolean
  champion: boolean
  /** One-line outcome, e.g. "🏆 NBA CHAMPION" or "❌ Out in the Second Round". */
  resultLine: string
}

const KEY = 'bap-daily-history-v1'

export function getDailyHistory(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getDailyRecord(dateKey: string): DailyRecord | null {
  return getDailyHistory().find((r) => r.dateKey === dateKey) ?? null
}

/** First write wins — the official run can't be overwritten by a replay. */
export function saveDailyRecord(record: DailyRecord): boolean {
  if (getDailyRecord(record.dateKey)) return false
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([...getDailyHistory(), record]),
    )
    return true
  } catch {
    return false
  }
}

export interface DailyStats {
  played: number
  championships: number
  cleanRuns: number
  bestOverall: number | null
  /** Consecutive days played ending today (or yesterday if today is unplayed). */
  streak: number
}

export function getDailyStats(now: Date = new Date()): DailyStats {
  const history = getDailyHistory()
  const byDay = new Set(history.map((r) => r.dayNumber))
  const today = dailyNumber(todayKey(now))

  let streak = 0
  let cursor = byDay.has(today) ? today : today - 1
  while (byDay.has(cursor)) {
    streak++
    cursor--
  }

  return {
    played: history.length,
    championships: history.filter((r) => r.champion).length,
    cleanRuns: history.filter((r) => r.flawId === null).length,
    bestOverall: history.length
      ? Math.max(...history.map((r) => r.overall))
      : null,
    streak,
  }
}
