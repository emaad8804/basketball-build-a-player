import { teamsForSeed } from '../constants/teamStrength'
import type { PlayInGame, PlayInResult, SeasonResult } from '../types'
import { clamp, pickRandom } from './random'
import type { BuildProfile } from './profile'
import { flawLabel, flawPGameDelta, rollGlassBones } from './flawEffects'
import { matchupWinProb, opponentStrength, playoffStrength } from './playoffSim'
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
 * The NBA play-in: seeds 7-8 play each other — the winner claims the
 * 7 seed, the loser gets one more life against the 9v10 winner for the
 * 8 seed. Seeds 9-10 must win two straight. Glass Bones rolls once at
 * the door, and every play-in game counts as an "opener" for Slow Starter.
 */
export function simulatePlayIn(
  profile: BuildProfile,
  season: SeasonResult,
): PlayInResult {
  const path: PlayInResult['path'] = season.seed <= 8 ? '7-8' : '9-10'

  if (rollGlassBones(profile.flaw)) {
    return { path, games: [], survived: false, seasonEndingInjury: true }
  }

  const flaw = profile.flaw
  const strength = playoffStrength(profile)

  const usedOpponents = new Set<string>(
    profile.homeTeamName ? [profile.homeTeamName] : [],
  )

  const games: PlayInGame[] = []
  let winsFor = 0
  let winsAgainst = 0

  const playGame = (oppSeed: number, home: boolean): boolean => {
    const opponent = pickRandom(
      teamsForSeed(oppSeed, season.conference, usedOpponents),
    ).name
    usedOpponents.add(opponent)
    const pGame = clamp(
      matchupWinProb(strength, opponentStrength(opponent, oppSeed)) +
        flawPGameDelta(flaw, 1),
      0.15,
      0.85,
    )

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
      opponent,
      won,
      scoreFor,
      scoreAgainst,
      seriesFor: winsFor,
      seriesAgainst: winsAgainst,
      statLine: generateGameStats(profile, won, false),
      recap,
      isGame7: false,
      home,
      ...(flawEvent ? { flawEvent } : {}),
    })
    return won
  }

  let survived: boolean
  let claimedSeed: 7 | 8 | undefined
  if (path === '7-8') {
    // The 7v8 game: the 7 seed hosts. Win it and the 7 seed is yours.
    if (playGame(season.seed === 7 ? 8 : 7, season.seed === 7)) {
      survived = true
      claimedSeed = 7
    } else {
      // One more life: host the 9v10 winner for the 8 seed.
      survived = playGame(9 + Math.floor(Math.random() * 2), true)
      if (survived) claimedSeed = 8
    }
  } else {
    // The 9v10 game (9 seed hosts), then travel to the 7v8 loser — win
    // two straight for the 8 seed or go home.
    survived =
      playGame(season.seed === 9 ? 10 : 9, season.seed === 9) &&
      playGame(7 + Math.floor(Math.random() * 2), false)
    if (survived) claimedSeed = 8
  }

  return { path, games, survived, ...(claimedSeed ? { seed: claimedSeed } : {}) }
}
