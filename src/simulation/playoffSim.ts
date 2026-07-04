import { NBA_TEAMS } from '../constants/teams'
import {
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

/** Map strength (60-99) to a per-game win probability. */
function strengthToWinProb(strength: number): number {
  return clamp(0.5 + (strength - 82) * 0.02, 0.2, 0.82)
}

export interface SeriesOutcome {
  won: boolean
  winsFor: number
  winsAgainst: number
  gameResults: boolean[]
}

/** Bernoulli game-by-game best-of-7 — upsets emerge from the binomial tail. */
export function simulateBestOf7(pGame: number, pGame7?: number): SeriesOutcome {
  let winsFor = 0
  let winsAgainst = 0
  const gameResults: boolean[] = []
  while (winsFor < 4 && winsAgainst < 4) {
    const isGame7 = winsFor === 3 && winsAgainst === 3
    const p = isGame7 && pGame7 !== undefined ? pGame7 : pGame
    const won = Math.random() < p
    gameResults.push(won)
    if (won) winsFor++
    else winsAgainst++
  }
  return { won: winsFor === 4, winsFor, winsAgainst, gameResults }
}

const ROUNDS: PlayoffRoundName[] = [
  'First Round',
  'Second Round',
  'Conference Finals',
]

const WIN_RECAPS = [
  'Your build controlled the series with poise on both ends.',
  'Clutch execution late in games sealed the series.',
  'Your build wore the opponent down and closed it out.',
  'Big fourth quarters swung the series your way.',
]
const CLOSE_WIN_RECAPS = [
  'A grueling series that came down to the final possessions.',
  'Your build survived a war and advanced.',
]
const LOSS_RECAPS = [
  'The opponent had an answer for everything late in games.',
  'Cold shooting stretches proved fatal in the biggest moments.',
  'Defensive lapses in crunch time ended the run.',
]

export function simulatePlayoffs(
  profile: BuildProfile,
  season: SeasonResult,
): PlayoffResult {
  const strength = playoffStrength(profile)
  const rounds: PlayoffRound[] = []

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

  for (const round of ROUNDS) {
    const pGame = clamp(
      strengthToWinProb(strength) -
        ROUND_DIFFICULTY[round] +
        gaussian(0, PLAYOFF_VARIANCE_STD),
      0.15,
      0.85,
    )
    const opponent = pickOpponent(season.conference)
    const outcome = simulateBestOf7(pGame)

    const recap = outcome.won
      ? outcome.winsAgainst >= 3
        ? pickRandom(CLOSE_WIN_RECAPS)
        : pickRandom(WIN_RECAPS)
      : pickRandom(LOSS_RECAPS)

    rounds.push({
      round,
      opponent,
      won: outcome.won,
      winsFor: outcome.winsFor,
      winsAgainst: outcome.winsAgainst,
      recap,
    })

    if (!outcome.won) {
      eliminatedIn = round
      break
    }
  }

  const reachedFinals = eliminatedIn === null
  // Playoff stats run slightly hotter than regular season for good builds
  const playoffStats = generateStatLine(profile, 1.04, 1.2)

  return { rounds, reachedFinals, eliminatedIn, playoffStats }
}
