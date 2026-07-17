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

/** Direct playoff berth (seed 1-6); 40-43 wins lands seeds 7-10 in the play-in. */
export const PLAYOFF_WIN_CUTOFF = 44

/** Baseline composite strength of a playoff team by seed (60-99 scale). */
export const SEED_BASE_STRENGTH: Record<number, number> = {
  1: 92,
  2: 90,
  3: 88,
  4: 86,
  5: 85,
  6: 84,
  7: 83,
  8: 81,
  9: 79,
  10: 78,
}

/**
 * Strength-differential → win-prob slope: each point of edge over the
 * opponent is worth this much per game. Deeper rounds are harder because
 * the opponents are better, not because of a flat round penalty.
 */
export const MATCHUP_COEFF = 0.018

/**
 * Per-game win-prob bounds for a playoff matchup. Even the biggest
 * favorite in a real playoff game sits around ~78%; the caps are what
 * keep sweeps rare and series long.
 */
export const MATCHUP_PROB_FLOOR = 0.25
export const MATCHUP_PROB_CEIL = 0.76

/** Per-game win-prob swing for playing at home. Real NBA playoff home teams win ~60%. */
export const HOME_COURT_EDGE = 0.035

/** Without its star, the team's edge collapses toward — but not to — a floor. */
export const STAR_ABSENCE_MULT = 0.55

export const SEASON_VARIANCE_STD = 0.045
/** Noise on the SERIES (stylistic matchup) — small, applies to every game in that series. */
export const SERIES_MATCHUP_STD = 0.02
/** Noise on each GAME — the coin's own wobble. This is what a best-of-7 washes out. */
export const GAME_VARIANCE_STD = 0.06
/** Game 7's own wobble is wider — anything can happen in a one-game season. */
export const GAME7_VARIANCE_STD = 0.09
