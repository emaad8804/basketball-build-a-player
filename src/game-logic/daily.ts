import { BUILD_GROUPS } from '../constants/attributes'
import type { Group } from '../types'
import { hashString } from './rng'

/** Daily Challenge #1. Days roll over at LOCAL midnight, Wordle-style. */
const EPOCH = { year: 2026, month: 7, day: 1 }

/** Local-date key, e.g. "2026-07-04". */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 1-based challenge number for a local date key. */
export function dailyNumber(dateKey: string = todayKey()): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = Date.UTC(y, m - 1, d)
  const epoch = Date.UTC(EPOCH.year, EPOCH.month - 1, EPOCH.day)
  return Math.floor((date - epoch) / 86400000) + 1
}

/** Everyone shares this seed for a given day. */
export function dailySeed(dateKey: string = todayKey()): number {
  return hashString(`bap-daily:${dateKey}`)
}

/**
 * The daily challenge dictates the build group (rotates by day) so every
 * player faces the identical spin sequence — group choice would fork it.
 */
export function dailyGroup(dateKey: string = todayKey()): Group {
  const n = dailyNumber(dateKey)
  return BUILD_GROUPS[((n % 3) + 3) % 3]
}
