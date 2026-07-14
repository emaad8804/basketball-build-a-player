import { NBA_TEAMS } from '../constants/teams'
import type { PlayInGame, PlayInResult, SeasonResult } from '../types'
import { clamp, pickRandom } from './random'
import type { BuildProfile } from './profile'
import { flawLabel, flawPGameDelta, rollGlassBones } from './flawEffects'
import { playoffStrength, strengthToWinProb } from './playoffSim'
import { generateGameStats, generateScore } from './seriesSim'

const WIN_RECAPS = [
  'Season saved with a cold-blooded fourth quarter.',
  'Your build refused to go home, taking over when it mattered most.',
  'A do-or-die masterclass — the playoff dream lives.',
]
const LOSS_RECAPS = [
  'The season ends in one night. No series, no tomorrow.',
  'A cold start in a one-game season proved fatal.',
  'The moment was too big and the shots would not fall.',
]
const SLOW_START_LOSS_RECAPS = [
  'A sleepy first half in a one-game season — the worst night to start slow.',
]
const BRICK_LOSS_RECAPS = [
  'Missed free throws in a two-possession game ended everything.',
]

/**
 * The play-in: 42-43 wins get the NBA-style second life (lose game 1,
 * one more elimination game); 40-41 must win two straight. Survivors
 * take the 8 seed. Glass Bones rolls once at the door, and every
 * play-in game counts as an "opener" for Slow Starter.
 */
export function simulatePlayIn(
  profile: BuildProfile,
  season: SeasonResult,
): PlayInResult {
  const path: PlayInResult['path'] = season.wins >= 42 ? '7-8' : '9-10'

  if (rollGlassBones(profile.flaw)) {
    return { path, games: [], survived: false, seasonEndingInjury: true }
  }

  const flaw = profile.flaw
  const pGame = clamp(
    strengthToWinProb(playoffStrength(profile)) + flawPGameDelta(flaw, 1),
    0.15,
    0.85,
  )

  const usedOpponents = new Set<string>(
    profile.homeTeamName ? [profile.homeTeamName] : [],
  )
  const pickOpponent = (): string => {
    const pool = NBA_TEAMS.filter(
      (t) => t.conference === season.conference && !usedOpponents.has(t.name),
    )
    const team = pickRandom(pool)
    usedOpponents.add(team.name)
    return team.name
  }

  const games: PlayInGame[] = []
  let winsFor = 0
  let winsAgainst = 0

  const playGame = (): boolean => {
    const won = Math.random() < pGame
    if (won) winsFor++
    else winsAgainst++
    const { scoreFor, scoreAgainst } = generateScore(
      won,
      profile.ratings.defense,
      true, // elimination nights are tight games
    )

    let flawEvent: string | undefined
    let recap: string
    if (!won && flaw?.id === 'slow-starter') {
      flawEvent = flawLabel(flaw)
      recap = pickRandom(SLOW_START_LOSS_RECAPS)
    } else if (!won && flaw?.id === 'brick-at-the-line' && scoreAgainst - scoreFor <= 6) {
      flawEvent = flawLabel(flaw)
      recap = pickRandom(BRICK_LOSS_RECAPS)
    } else {
      recap = won ? pickRandom(WIN_RECAPS) : pickRandom(LOSS_RECAPS)
    }

    games.push({
      gameNumber: games.length + 1,
      opponent: pickOpponent(),
      won,
      scoreFor,
      scoreAgainst,
      seriesFor: winsFor,
      seriesAgainst: winsAgainst,
      statLine: generateGameStats(profile, won, false),
      recap,
      isGame7: false,
      // NBA play-in venues: the 7/8 team hosts both its games; the 9/10
      // team hosts the first and travels to the 7/8 loser for the second.
      home: path === '7-8' || games.length === 0,
      ...(flawEvent ? { flawEvent } : {}),
    })
    return won
  }

  let survived: boolean
  if (path === '7-8') {
    // Lose the first game and you get one more life
    survived = playGame() || playGame()
  } else {
    // 9/10 path: win two straight or go home
    survived = playGame() && playGame()
  }

  return { path, games, survived }
}
