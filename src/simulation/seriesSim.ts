import type { SeriesGame } from '../types'
import { clamp, gaussian, pickRandom } from './random'
import type { BuildProfile } from './profile'
import {
  flawPGameDelta,
  flawPGame7Delta,
  flawLabel,
  injuryPerGameChance,
} from './flawEffects'

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

const BRICK_LOSS_RECAPS = [
  'Six missed free throws down the stretch handed the game away.',
  'Hack-a-strategy worked to perfection — the line was unkind again.',
]
const SLOW_START_LOSS_RECAPS = [
  'A sleepy first half dug a hole the comeback never escaped.',
  'The series opened with your build a step behind everything.',
]
const ICE_COLD_G7_RECAPS = [
  'Frozen solid in Game 7 — 2-for-13 with the season on the line.',
  'The moment arrived and your build shrank from it. Ice in the worst way.',
]

/** Clean-build flavor for won elimination games — light touch only. */
const CLEAN_ELIMINATION_RECAPS = [
  'No weakness to attack — your build was pure ice when it mattered.',
  'A flawless closer: no crack in the armor for the opponent to pry open.',
]

export function generateGameStats(
  profile: BuildProfile,
  won: boolean,
  isGame7: boolean,
): SeriesGame['statLine'] {
  const r = profile.ratings
  const d = (x: number) => x - 70
  const boost = won ? 1.05 : 0.94
  const iceCold = profile.flaw?.id === 'ice-cold'
  // Ice Cold suppresses the clutch stat bump (and dampens Game 7 lines)
  const g7Boost = isGame7
    ? iceCold
      ? 0.85 + (profile.flaw!.softened ? 0.07 : 0)
      : r.iqClutch >= 94
        ? 1.12
        : 1
    : 1

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

export function generateScore(
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
 * The build's Fatal Flaw hooks in per game: win-prob deltas, Injury
 * Prone DNP stretches, and explicit flaw event lines on affected games.
 */
export function simulateDetailedSeries(
  profile: BuildProfile,
  pGame: number,
  pGame7: number,
): DetailedSeries {
  const flaw = profile.flaw
  const games: SeriesGame[] = []
  let winsFor = 0
  let winsAgainst = 0
  let injuredGamesLeft = 0

  while (winsFor < 4 && winsAgainst < 4) {
    const gameNumber = games.length + 1
    const isGame7 = gameNumber === 7
    const sitting = injuredGamesLeft > 0

    // Team plays badly without its star; flaw deltas only apply when playing
    const p = sitting
      ? 0.25
      : clamp(
          isGame7
            ? pGame7 + flawPGame7Delta(flaw)
            : pGame + flawPGameDelta(flaw, gameNumber),
          0.1,
          0.9,
        )
    const won = Math.random() < p
    if (won) winsFor++
    else winsAgainst++

    const { scoreFor, scoreAgainst } = generateScore(
      won,
      profile.ratings.defense,
      isGame7,
    )
    const clinched = winsFor === 4
    const eliminationGame = winsFor === 3 || winsAgainst === 3

    let flawEvent: string | undefined
    let recap: string

    if (sitting) {
      injuredGamesLeft--
      flawEvent = `${flawLabel(flaw!)} — DNP (injury)`
      recap = won
        ? 'The supporting cast survived a game without their star.'
        : 'Without their star, the team never stood a chance.'
    } else if (isGame7) {
      if (flaw?.id === 'ice-cold' && !won) {
        flawEvent = flawLabel(flaw)
        recap = pickRandom(ICE_COLD_G7_RECAPS)
      } else {
        recap = won ? pickRandom(GAME7_WIN_RECAPS) : pickRandom(GAME7_LOSS_RECAPS)
        if (won && !flaw && eliminationGame && Math.random() < 0.5) {
          recap = pickRandom(CLEAN_ELIMINATION_RECAPS)
        }
      }
    } else if (clinched) {
      recap = pickRandom(CLINCH_RECAPS)
    } else if (!won && flaw?.id === 'brick-at-the-line' && scoreAgainst - scoreFor <= 6) {
      flawEvent = flawLabel(flaw)
      recap = pickRandom(BRICK_LOSS_RECAPS)
    } else if (!won && flaw?.id === 'slow-starter' && gameNumber <= 2) {
      flawEvent = flawLabel(flaw)
      recap = pickRandom(SLOW_START_LOSS_RECAPS)
    } else {
      recap = won ? pickRandom(WIN_RECAPS) : pickRandom(LOSS_RECAPS)
      if (won && !flaw && eliminationGame && Math.random() < 0.35) {
        recap = pickRandom(CLEAN_ELIMINATION_RECAPS)
      }
    }

    const statLine = sitting
      ? { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 }
      : generateGameStats(profile, won, isGame7)

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
      ...(flawEvent ? { flawEvent } : {}),
      ...(sitting ? { dnp: true } : {}),
    })

    // Injury Prone: each game actually played risks sitting the next two
    if (!sitting && winsFor < 4 && winsAgainst < 4) {
      if (Math.random() < injuryPerGameChance(flaw)) {
        injuredGamesLeft = 2
      }
    }
  }

  return { games, won: winsFor === 4, winsFor, winsAgainst }
}
