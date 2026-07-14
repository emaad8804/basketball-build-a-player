import {
  GAME7_VARIANCE_STD,
  GAME_VARIANCE_STD,
  HOME_COURT_EDGE,
  STAR_ABSENCE_MULT,
} from '../constants/weights'
import type { SeriesGame } from '../types'
import { clamp, gaussian } from './random'
import type { BuildProfile } from './profile'
import {
  flawPGameDelta,
  flawPGame7Delta,
  flawLabel,
  injuryPerGameChance,
} from './flawEffects'
import {
  BRICK_LOSS_RECAPS,
  CLEAN_ELIMINATION_RECAPS,
  CLINCH_RECAPS,
  GAME7_LOSS_RECAPS,
  GAME7_WIN_RECAPS,
  ICE_COLD_G7_RECAPS,
  SLOW_START_LOSS_RECAPS,
  pickFrom,
  pickRecap,
  type RecapContext,
} from './recaps'

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

/** Games the team holding home-court advantage hosts (2-2-1-1-1). */
const HCA_HOME_GAMES = [1, 2, 5, 7]

/**
 * Best-of-7 played one Bernoulli game at a time with full per-game
 * detail (score, stat line, recap). Game 7 uses its own win prob.
 * Home court follows the standard 2-2-1-1-1 spine: ±HOME_COURT_EDGE
 * per game depending on venue. The build's Fatal Flaw hooks in per
 * game: win-prob deltas, Injury Prone DNP stretches, and explicit
 * flaw event lines on affected games.
 */
export function simulateDetailedSeries(
  profile: BuildProfile,
  pGame: number,
  pGame7: number,
  hasHomeCourt: boolean,
): DetailedSeries {
  const flaw = profile.flaw
  const games: SeriesGame[] = []
  let winsFor = 0
  let winsAgainst = 0
  let injuredGamesLeft = 0
  const usedRecaps = new Set<string>() // no repeated line within one series

  while (winsFor < 4 && winsAgainst < 4) {
    const gameNumber = games.length + 1
    const isGame7 = gameNumber === 7
    const sitting = injuredGamesLeft > 0
    const home = HCA_HOME_GAMES.includes(gameNumber) === hasHomeCourt
    const homeEdge = home ? HOME_COURT_EDGE : -HOME_COURT_EDGE

    // Each game rolls its own noise — a bad break costs a game, never
    // silently a whole series. Game 7's wobble is wider.
    const gameNoise = gaussian(
      0,
      isGame7 ? GAME7_VARIANCE_STD : GAME_VARIANCE_STD,
    )

    // What this team's odds are tonight, before the star's own quirks.
    const pBase = clamp(
      (isGame7 ? pGame7 : pGame) + homeEdge + gameNoise,
      0.1,
      0.9,
    )
    // Without its star the edge collapses relative to what the team was —
    // a 96 build's team without him is still better than a 78 build's.
    // Flaw deltas only apply when the star actually plays.
    const p = sitting
      ? clamp(pBase * STAR_ABSENCE_MULT, 0.12, 0.5)
      : clamp(
          pBase +
            (isGame7
              ? flawPGame7Delta(flaw)
              : flawPGameDelta(flaw, gameNumber)),
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

    // Stat line first — recap pools read the box score.
    const statLine = sitting
      ? { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 }
      : generateGameStats(profile, won, isGame7)
    const ctx: RecapContext = {
      won,
      isGame7,
      clinched,
      eliminationGame,
      gameNumber,
      margin: Math.abs(scoreFor - scoreAgainst),
      statLine,
      flawId: flaw?.id ?? null,
    }

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
        recap = pickFrom(ICE_COLD_G7_RECAPS, ctx, usedRecaps)
      } else {
        recap = won
          ? pickFrom(GAME7_WIN_RECAPS, ctx, usedRecaps)
          : pickFrom(GAME7_LOSS_RECAPS, ctx, usedRecaps)
        if (won && !flaw && eliminationGame && Math.random() < 0.5) {
          recap = pickFrom(CLEAN_ELIMINATION_RECAPS, ctx, usedRecaps)
        }
      }
    } else if (clinched) {
      recap = pickFrom(CLINCH_RECAPS, ctx, usedRecaps)
    } else if (!won && flaw?.id === 'brick-at-the-line' && scoreAgainst - scoreFor <= 6) {
      flawEvent = flawLabel(flaw)
      recap = pickFrom(BRICK_LOSS_RECAPS, ctx, usedRecaps)
    } else if (!won && flaw?.id === 'slow-starter' && gameNumber <= 2) {
      flawEvent = flawLabel(flaw)
      recap = pickFrom(SLOW_START_LOSS_RECAPS, ctx, usedRecaps)
    } else {
      recap = pickRecap(ctx, usedRecaps)
      if (won && !flaw && eliminationGame && Math.random() < 0.35) {
        recap = pickFrom(CLEAN_ELIMINATION_RECAPS, ctx, usedRecaps)
      }
    }

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
      home,
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
