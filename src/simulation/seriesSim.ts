import type { SeriesGame } from '../types'
import { clamp, gaussian, pickRandom } from './random'
import type { BuildProfile } from './profile'

const WIN_RECAPS = [
  'Your build controlled the fourth quarter with elite shot creation.',
  'A dominant two-way performance put the opponent on their heels.',
  'Timely defensive stops and efficient offense carried the night.',
  'Your build caught fire from deep and never looked back.',
  'The opponent had no answer inside as your build owned the paint.',
  'A fast start set the tone and the lead never slipped away.',
]
const LOSS_RECAPS = [
  'The opponent forced tough shots late and stole one.',
  'Cold shooting in the fourth quarter proved costly.',
  'A hot night from the opposing star evened things up.',
  'Turnovers in crunch time flipped a winnable game.',
  'The bench battle went the wrong way in a physical game.',
]
const CLINCH_RECAPS = [
  'Your build delivered a series-clinching performance.',
  'An ice-cold closing stretch sealed the series.',
  'Your build slammed the door with a statement win.',
]
const GAME7_WIN_RECAPS = [
  'In a winner-take-all Game 7, your build delivered an all-time clutch performance.',
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
): SeriesGame['statLine'] {
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

export interface DetailedSeries {
  games: SeriesGame[]
  won: boolean
  winsFor: number
  winsAgainst: number
}

/**
 * Best-of-7 played one Bernoulli game at a time with full per-game
 * detail (score, stat line, recap). Game 7 uses its own win prob.
 */
export function simulateDetailedSeries(
  profile: BuildProfile,
  pGame: number,
  pGame7: number,
): DetailedSeries {
  const games: SeriesGame[] = []
  let winsFor = 0
  let winsAgainst = 0

  while (winsFor < 4 && winsAgainst < 4) {
    const gameNumber = games.length + 1
    const isGame7 = gameNumber === 7
    const won = Math.random() < (isGame7 ? pGame7 : pGame)
    if (won) winsFor++
    else winsAgainst++

    const { scoreFor, scoreAgainst } = generateScore(
      won,
      profile.ratings.defense,
      isGame7,
    )
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
      statLine: generateGameStats(profile, won, isGame7),
      recap,
      isGame7,
    })
  }

  return { games, won: winsFor === 4, winsFor, winsAgainst }
}
