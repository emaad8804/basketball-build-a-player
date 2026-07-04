import { NBA_TEAMS } from '../constants/teams'
import {
  GAME7_VARIANCE_STD,
  GAME7_WEIGHTS,
  PLAYOFF_VARIANCE_STD,
  PLAYOFF_WEIGHTS,
  ROUND_DIFFICULTY,
} from '../constants/weights'
import type {
  PlayoffResult,
  PlayoffRound,
  PlayoffRoundName,
  SeasonResult,
} from '../types'
import { clamp, gaussian, pickRandom } from './random'
import type { BuildProfile } from './profile'
import { generateStatLine } from './seasonSim'
import { simulateDetailedSeries } from './seriesSim'

/** Composite playoff strength (60-99 scale) from the spec's listed factors. */
export function playoffStrength(profile: BuildProfile): number {
  const r = profile.ratings
  return (
    profile.overall * PLAYOFF_WEIGHTS.overall +
    r.iqClutch * PLAYOFF_WEIGHTS.iqClutch +
    r.defense * PLAYOFF_WEIGHTS.defense +
    r.shooting * PLAYOFF_WEIGHTS.shooting +
    r.playmaking * PLAYOFF_WEIGHTS.playmaking +
    r.frame * PLAYOFF_WEIGHTS.frame +
    r.rebounding * PLAYOFF_WEIGHTS.rebounding
  )
}

function game7Strength(profile: BuildProfile): number {
  const r = profile.ratings
  return (
    r.iqClutch * GAME7_WEIGHTS.iqClutch +
    r.defense * GAME7_WEIGHTS.defense +
    r.shooting * GAME7_WEIGHTS.shooting +
    r.playmaking * GAME7_WEIGHTS.playmaking +
    r.frame * GAME7_WEIGHTS.frame
  )
}

/** Map strength (60-99) to a per-game win probability. */
function strengthToWinProb(strength: number): number {
  return clamp(0.5 + (strength - 82) * 0.02, 0.2, 0.82)
}

const ROUNDS: PlayoffRoundName[] = [
  'First Round',
  'Second Round',
  'Conference Finals',
]

const SERIES_WIN_RECAPS = [
  'Your build controlled the series with poise on both ends.',
  'Clutch execution late in games sealed the series.',
  'Your build wore the opponent down and closed it out.',
]
const SERIES_CLOSE_WIN_RECAPS = [
  'A grueling series that came down to the final possessions.',
  'Your build survived a war and advanced.',
]
const SERIES_LOSS_RECAPS = [
  'The opponent had an answer for everything late in games.',
  'Cold shooting stretches proved fatal in the biggest moments.',
  'Defensive lapses in crunch time ended the run.',
]

/**
 * Standard bracket path from the user's seed:
 * R1 vs (9 - seed); R2 vs the adjacent pair (stronger seed survives 70%
 * of the time); Conf Finals vs the strongest likely seed from the other
 * half of the bracket.
 */
function opponentSeedsForPath(seed: number): [number, number, number] {
  const r1 = 9 - seed

  const inTopQuartet = [1, 8, 4, 5].includes(seed)
  const r2Pair: [number, number] = inTopQuartet
    ? [1, 8].includes(seed)
      ? [4, 5]
      : [1, 8]
    : [2, 7].includes(seed)
      ? [3, 6]
      : [2, 7]
  const r2 = Math.random() < 0.7 ? Math.min(...r2Pair) : Math.max(...r2Pair)

  const otherHalfBest = inTopQuartet || [4, 5].includes(seed) ? 2 : 1
  const cf = Math.random() < 0.7 ? otherHalfBest : otherHalfBest + 1 + Math.floor(Math.random() * 2)

  return [r1, r2, cf]
}

/** Better-seeded opponents are harder: ±1% win prob per seed step from 4.5. */
function seedAdjustment(opponentSeed: number): number {
  return (opponentSeed - 4.5) * 0.01
}

export function simulatePlayoffs(
  profile: BuildProfile,
  season: SeasonResult,
): PlayoffResult {
  const strength = playoffStrength(profile)
  const pGame7Base = clamp(
    0.5 + (game7Strength(profile) - 82) * 0.025,
    0.15,
    0.85,
  )
  const rounds: PlayoffRound[] = []
  const opponentSeeds = opponentSeedsForPath(season.seed)

  const usedOpponents = new Set<string>()
  const pickOpponent = (conf: 'East' | 'West'): string => {
    const pool = NBA_TEAMS.filter(
      (t) => t.conference === conf && !usedOpponents.has(t.name),
    )
    const team = pickRandom(pool)
    usedOpponents.add(team.name)
    return team.name
  }

  let eliminatedIn: PlayoffRoundName | null = null

  for (let i = 0; i < ROUNDS.length; i++) {
    const round = ROUNDS[i]
    const opponentSeed = clamp(Math.round(opponentSeeds[i]), 1, 8)
    const pGame = clamp(
      strengthToWinProb(strength) -
        ROUND_DIFFICULTY[round] +
        seedAdjustment(opponentSeed) +
        gaussian(0, PLAYOFF_VARIANCE_STD),
      0.15,
      0.85,
    )
    const pGame7 = clamp(
      pGame7Base + seedAdjustment(opponentSeed) + gaussian(0, GAME7_VARIANCE_STD),
      0.12,
      0.88,
    )
    const opponent = pickOpponent(season.conference)
    const series = simulateDetailedSeries(profile, pGame, pGame7)

    const recap = series.won
      ? series.winsAgainst >= 3
        ? pickRandom(SERIES_CLOSE_WIN_RECAPS)
        : pickRandom(SERIES_WIN_RECAPS)
      : pickRandom(SERIES_LOSS_RECAPS)

    rounds.push({
      round,
      opponent,
      opponentSeed,
      won: series.won,
      winsFor: series.winsFor,
      winsAgainst: series.winsAgainst,
      games: series.games,
      recap,
    })

    if (!series.won) {
      eliminatedIn = round
      break
    }
  }

  const reachedFinals = eliminatedIn === null
  // Playoff stats run slightly hotter than regular season for good builds
  const playoffStats = generateStatLine(profile, 1.04, 1.2)

  return { rounds, reachedFinals, eliminatedIn, playoffStats }
}
