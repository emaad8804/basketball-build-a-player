import { NBA_TEAMS } from '../constants/teams'
import {
  FINALS_VARIANCE_STD,
  FINALS_WEIGHTS,
  GAME7_VARIANCE_STD,
  GAME7_WEIGHTS,
  ROUND_DIFFICULTY,
} from '../constants/weights'
import type {
  FinalsGame,
  FinalsResult,
  SeasonResult,
  StatLine,
} from '../types'
import { clamp, gaussian, pickRandom, round1 } from './random'
import type { BuildProfile } from './profile'

function finalsStrength(profile: BuildProfile): number {
  const r = profile.ratings
  return (
    profile.overall * FINALS_WEIGHTS.overall +
    r.iqClutch * FINALS_WEIGHTS.iqClutch +
    r.defense * FINALS_WEIGHTS.defense +
    r.shooting * FINALS_WEIGHTS.shooting +
    r.playmaking * FINALS_WEIGHTS.playmaking +
    r.frame * FINALS_WEIGHTS.frame
  )
}

/** Game 7 drops overall entirely — pure clutch profile, wider variance. */
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

const WIN_RECAPS = [
  'Your build controlled the fourth quarter with elite shot creation.',
  'A dominant two-way performance put the opponent on their heels.',
  'Timely defensive stops and efficient offense carried the night.',
  'Your build caught fire from deep and never looked back.',
  'The opponent had no answer inside as your build owned the paint.',
]
const LOSS_RECAPS = [
  'The opponent forced tough shots late and stole one.',
  'Cold shooting in the fourth quarter proved costly.',
  'A hot night from the opposing star evened things up.',
  'Turnovers in crunch time flipped a winnable game.',
]
const CLINCH_RECAPS = [
  'Your build delivered a championship-clinching performance.',
  'An ice-cold closing stretch sealed the title.',
]
const GAME7_WIN_RECAPS = [
  'In the biggest game of the year, your build delivered an all-time clutch performance.',
  'Game 7 legend status: your build took over when it mattered most.',
]
const GAME7_LOSS_RECAPS = [
  'Heartbreak in Game 7 — the opponent made one more play.',
  'A legendary duel ended in agony as the final shot rimmed out.',
]

function generateGameStats(
  profile: BuildProfile,
  won: boolean,
  isGame7: boolean,
): FinalsGame['statLine'] {
  const r = profile.ratings
  const d = (x: number) => x - 70
  const boost = won ? 1.05 : 0.94
  const g7Boost = isGame7 && r.iqClutch >= 94 ? 1.12 : 1

  const pts = clamp(
    Math.round(
      (24 + d(r.shooting) * 0.3 + d(r.finishing) * 0.2) * boost * g7Boost +
        gaussian(0, 5),
    ),
    12,
    52,
  )
  const reb = clamp(
    Math.round(5.5 + d(r.rebounding) * 0.16 + d(r.frame) * 0.05 + gaussian(0, 2)),
    2,
    18,
  )
  const ast = clamp(
    Math.round(4.5 + d(r.playmaking) * 0.15 + gaussian(0, 1.8)),
    1,
    14,
  )
  const stl = clamp(Math.round(1 + d(r.defense) * 0.03 + gaussian(0, 0.8)), 0, 5)
  const blk = clamp(
    Math.round(0.5 + d(r.defense) * 0.025 + d(r.frame) * 0.02 + gaussian(0, 0.7)),
    0,
    5,
  )
  return { pts, reb, ast, stl, blk }
}

function generateScore(
  won: boolean,
  defense: number,
  isGame7: boolean,
): { scoreFor: number; scoreAgainst: number } {
  // Elite defense (A+/S) holds opponents lower, per spec Game 7 logic
  const defenseDamp = defense >= 94 ? 6 : defense >= 90 ? 3 : 0
  const oppBase = Math.round(108 - defenseDamp + gaussian(0, 6))
  const margin = isGame7
    ? 1 + Math.floor(Math.random() * 6)
    : 3 + Math.floor(Math.random() * 12)
  return won
    ? { scoreFor: oppBase + margin, scoreAgainst: oppBase }
    : { scoreFor: oppBase - margin, scoreAgainst: oppBase }
}

export function simulateFinals(
  profile: BuildProfile,
  season: SeasonResult,
): FinalsResult {
  const oppConference = season.conference === 'East' ? 'West' : 'East'
  const opponent = pickRandom(
    NBA_TEAMS.filter((t) => t.conference === oppConference),
  ).name

  const pGame = clamp(
    0.5 +
      (finalsStrength(profile) - 82) * 0.02 -
      ROUND_DIFFICULTY['NBA Finals'] +
      gaussian(0, FINALS_VARIANCE_STD),
    0.18,
    0.8,
  )
  const pGame7 = clamp(
    0.5 + (game7Strength(profile) - 82) * 0.025 + gaussian(0, GAME7_VARIANCE_STD),
    0.15,
    0.85,
  )

  const games: FinalsGame[] = []
  let winsFor = 0
  let winsAgainst = 0

  while (winsFor < 4 && winsAgainst < 4) {
    const gameNumber = games.length + 1
    const isGame7 = gameNumber === 7
    const p = isGame7 ? pGame7 : pGame
    const won = Math.random() < p
    if (won) winsFor++
    else winsAgainst++

    const { scoreFor, scoreAgainst } = generateScore(
      won,
      profile.ratings.defense,
      isGame7,
    )
    const statLine = generateGameStats(profile, won, isGame7)
    const clinched = winsFor === 4

    let recap: string
    if (isGame7) recap = won ? pickRandom(GAME7_WIN_RECAPS) : pickRandom(GAME7_LOSS_RECAPS)
    else if (clinched) recap = pickRandom(CLINCH_RECAPS)
    else recap = won ? pickRandom(WIN_RECAPS) : pickRandom(LOSS_RECAPS)

    games.push({
      gameNumber,
      won,
      scoreFor,
      scoreAgainst,
      seriesFor: winsFor,
      seriesAgainst: winsAgainst,
      statLine,
      recap,
      isGame7,
    })
  }

  const won = winsFor === 4
  const n = games.length
  const avg = (f: (g: FinalsGame) => number) =>
    round1(games.reduce((s, g) => s + f(g), 0) / n)

  const averages: StatLine = {
    ppg: avg((g) => g.statLine.pts),
    rpg: avg((g) => g.statLine.reb),
    apg: avg((g) => g.statLine.ast),
    spg: avg((g) => g.statLine.stl),
    bpg: avg((g) => g.statLine.blk),
    fgPct: round1(clamp(46 + (profile.ratings.finishing - 70) * 0.14 + gaussian(0, 2), 40, 62)),
    threePct: round1(clamp(35 + (profile.ratings.shooting - 70) * 0.25 + gaussian(0, 2.5), 26, 46)),
  }

  return {
    opponent,
    games,
    won,
    winsFor,
    winsAgainst,
    finalsMvp: won, // solo-star build: champion == Finals MVP
    averages,
  }
}
