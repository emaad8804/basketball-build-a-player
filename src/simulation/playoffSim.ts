import { teamTierFor, teamsForSeed } from '../constants/teamStrength'
import {
  GAME7_WEIGHTS,
  MATCHUP_COEFF,
  MATCHUP_PROB_CEIL,
  MATCHUP_PROB_FLOOR,
  PLAYOFF_WEIGHTS,
  SEED_BASE_STRENGTH,
  SERIES_MATCHUP_STD,
} from '../constants/weights'
import type {
  PlayoffResult,
  PlayoffRound,
  PlayoffRoundName,
  SeasonResult,
} from '../types'
import { clamp, gaussian, pickRandom } from './random'
import type { BuildProfile } from './profile'
import { flawLabel, flawStrengthDelta, rollGlassBones } from './flawEffects'
import { pickSeriesRecap, seriesVerdict } from './recaps'
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
    r.rebounding * PLAYOFF_WEIGHTS.rebounding +
    flawStrengthDelta(profile.flaw) +
    profile.teamStrengthDelta
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

/** Opponent's composite strength on the same 60-99 scale as playoffStrength(). */
export function opponentStrength(opponentName: string, seed: number): number {
  // Base by seed (a 1-seed is genuinely a better team than an 8-seed)
  // plus the named team's tier delta.
  return SEED_BASE_STRENGTH[seed] + teamTierFor(opponentName).strengthDelta
}

/** Strength differential → per-game win probability. */
export function matchupWinProb(mine: number, theirs: number): number {
  return clamp(
    0.5 + (mine - theirs) * MATCHUP_COEFF,
    MATCHUP_PROB_FLOOR,
    MATCHUP_PROB_CEIL,
  )
}

const ROUNDS: PlayoffRoundName[] = [
  'First Round',
  'Second Round',
  'Conference Finals',
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

export function simulatePlayoffs(
  profile: BuildProfile,
  season: SeasonResult,
  seedOverride?: number,
): PlayoffResult {
  const strength = playoffStrength(profile)
  const clutch = game7Strength(profile)
  const rounds: PlayoffRound[] = []
  // Play-in survivors enter with the seed they claimed (7 or 8)
  const buildSeed = clamp(seedOverride ?? season.seed, 1, 8)
  const opponentSeeds = opponentSeedsForPath(buildSeed)

  // Never draw your own team as an opponent
  const usedOpponents = new Set<string>(
    profile.homeTeamName ? [profile.homeTeamName] : [],
  )
  const pickOpponent = (conf: 'East' | 'West', seed: number): string => {
    const team = pickRandom(teamsForSeed(seed, conf, usedOpponents))
    usedOpponents.add(team.name)
    return team.name
  }

  let eliminatedIn: PlayoffRoundName | null = null
  let seasonEndingInjury: PlayoffRoundName | undefined

  for (let i = 0; i < ROUNDS.length; i++) {
    const round = ROUNDS[i]

    // Glass Bones: every round entry rolls the dice on the whole season
    if (rollGlassBones(profile.flaw)) {
      seasonEndingInjury = round
      eliminatedIn = round
      break
    }
    const opponentSeed = clamp(Math.round(opponentSeeds[i]), 1, 8)
    const opponent = pickOpponent(season.conference, opponentSeed)
    const oppStrength = opponentStrength(opponent, opponentSeed)
    // A stylistic matchup has a character: one small draw colors the
    // whole series. Per-game wobble lives inside the series sim.
    const matchupNoise = gaussian(0, SERIES_MATCHUP_STD)
    const pGame = clamp(
      matchupWinProb(strength, oppStrength) + matchupNoise,
      0.15,
      0.85,
    )
    // Game 7 is a pure clutch profile, but still against THIS opponent.
    const pGame7 = clamp(
      0.5 + (clutch - oppStrength) * 0.025 + matchupNoise,
      0.12,
      0.88,
    )
    // Home court goes to the better seed (lower number)
    const series = simulateDetailedSeries(
      profile,
      pGame,
      pGame7,
      buildSeed < opponentSeed,
    )

    const recap = pickSeriesRecap(series.won, series.winsAgainst)
    const verdict = seriesVerdict({
      won: series.won,
      winsFor: series.winsFor,
      games: series.games,
      opponent,
      myStrength: strength,
      oppStrength,
      flawName: profile.flaw ? flawLabel(profile.flaw) : null,
      fallback: recap,
    })

    rounds.push({
      round,
      opponent,
      opponentSeed,
      won: series.won,
      winsFor: series.winsFor,
      winsAgainst: series.winsAgainst,
      games: series.games,
      recap,
      verdict,
    })

    if (!series.won) {
      eliminatedIn = round
      break
    }
  }

  const reachedFinals = eliminatedIn === null
  // Playoff stats run slightly hotter than regular season for good builds
  const playoffStats = generateStatLine(profile, 1.04, 1.2)

  return {
    rounds,
    reachedFinals,
    eliminatedIn,
    playoffStats,
    ...(seasonEndingInjury ? { seasonEndingInjury } : {}),
  }
}
