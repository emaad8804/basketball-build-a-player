import type { AttributeKey, Group } from '../types'

/** Per-group overall-rating weights (each sums to 100), straight from the spec. */
export const OVERALL_WEIGHTS: Record<Group, Record<AttributeKey, number>> = {
  Guards: {
    shooting: 17,
    ballHandling: 16,
    playmaking: 16,
    iqClutch: 13,
    finishing: 12,
    athleticism: 10,
    defense: 8,
    frame: 5,
    rebounding: 3,
  },
  Forwards: {
    frame: 14,
    athleticism: 14,
    defense: 14,
    finishing: 13,
    shooting: 13,
    iqClutch: 10,
    playmaking: 9,
    rebounding: 8,
    ballHandling: 5,
  },
  Centers: {
    frame: 16,
    defense: 16,
    rebounding: 15,
    finishing: 13,
    iqClutch: 11,
    playmaking: 9,
    shooting: 8,
    athleticism: 8,
    ballHandling: 4,
  },
}

/**
 * Playoff strength: how much each factor contributes to a build's
 * per-game win probability in a playoff series (sums to 1).
 * `overall` is the composite; the rest are the spec's listed playoff factors.
 */
export const PLAYOFF_WEIGHTS = {
  overall: 0.35,
  iqClutch: 0.2,
  defense: 0.15,
  shooting: 0.1,
  playmaking: 0.1,
  frame: 0.05,
  rebounding: 0.05,
} as const

/** Finals shifts more weight to clutch factors. */
export const FINALS_WEIGHTS = {
  overall: 0.25,
  iqClutch: 0.2,
  defense: 0.15,
  shooting: 0.15,
  playmaking: 0.15,
  frame: 0.1,
} as const

/** Game 7 drops the composite entirely — pure clutch attributes, per spec. */
export const GAME7_WEIGHTS = {
  iqClutch: 0.3,
  defense: 0.2,
  shooting: 0.2,
  playmaking: 0.2,
  frame: 0.1,
} as const

/** Rating (60-99) → expected regular-season win% anchors; lerped between. */
export const WIN_PCT_ANCHORS: [number, number][] = [
  [60, 0.25],
  [70, 0.35],
  [80, 0.45],
  [88, 0.55],
  [90, 0.6],
  [94, 0.7],
  [96, 0.78],
  [98, 0.85],
  [99, 0.9],
]

/** Extra difficulty subtracted from per-game win prob as rounds deepen. */
export const ROUND_DIFFICULTY: Record<string, number> = {
  'First Round': 0.0,
  'Second Round': 0.05,
  'Conference Finals': 0.09,
  'NBA Finals': 0.12,
}

export const SEASON_VARIANCE_STD = 0.045
export const PLAYOFF_VARIANCE_STD = 0.05
export const FINALS_VARIANCE_STD = 0.06
export const GAME7_VARIANCE_STD = 0.09
