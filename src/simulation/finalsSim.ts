import { NBA_TEAMS } from '../constants/teams'
import { teamTierFor } from '../constants/teamStrength'
import {
  FINALS_WEIGHTS,
  GAME7_WEIGHTS,
  SERIES_MATCHUP_STD,
  WIN_PCT_ANCHORS,
} from '../constants/weights'
import { matchupWinProb, opponentStrength } from './playoffSim'
import type { FinalsResult, SeasonResult, SeriesGame, StatLine } from '../types'
import { clamp, gaussian, lerpAnchors, pickRandom, round1 } from './random'
import type { BuildProfile } from './profile'
import { flawStrengthDelta } from './flawEffects'
import { simulateDetailedSeries } from './seriesSim'

function finalsStrength(profile: BuildProfile): number {
  const r = profile.ratings
  return (
    profile.overall * FINALS_WEIGHTS.overall +
    r.iqClutch * FINALS_WEIGHTS.iqClutch +
    r.defense * FINALS_WEIGHTS.defense +
    r.shooting * FINALS_WEIGHTS.shooting +
    r.playmaking * FINALS_WEIGHTS.playmaking +
    r.frame * FINALS_WEIGHTS.frame +
    flawStrengthDelta(profile.flaw) +
    profile.teamStrengthDelta
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

export function simulateFinals(
  profile: BuildProfile,
  season: SeasonResult,
): FinalsResult {
  const oppConference = season.conference === 'East' ? 'West' : 'East'
  // It's the Finals — the opponent is essentially always a strong team.
  const inConference = NBA_TEAMS.filter((t) => t.conference === oppConference)
  const strongPool = inConference.filter((t) =>
    ['contender', 'playoff-lock'].includes(teamTierFor(t.name).id),
  )
  const opponent = pickRandom(
    strongPool.length > 0 ? strongPool : inConference,
  ).name

  // The other conference's champ is a top seed by definition.
  const oppSeed = Math.random() < 0.5 ? 1 : 2
  const oppStrength = opponentStrength(opponent, oppSeed)
  // One stylistic-matchup draw colors the whole series; per-game wobble
  // lives inside the series sim.
  const matchupNoise = gaussian(0, SERIES_MATCHUP_STD)
  const pGame = clamp(
    matchupWinProb(finalsStrength(profile), oppStrength) + matchupNoise,
    0.15,
    0.85,
  )
  const pGame7 = clamp(
    0.5 + (game7Strength(profile) - oppStrength) * 0.025 + matchupNoise,
    0.15,
    0.85,
  )

  // Finals home court goes to the better regular-season record; the
  // opponent's is estimated from its strength on the season-sim anchors.
  const oppWins = Math.round(lerpAnchors(WIN_PCT_ANCHORS, oppStrength) * 82)
  const hasHomeCourt = season.wins > oppWins

  const { games, won, winsFor, winsAgainst } = simulateDetailedSeries(
    profile,
    pGame,
    pGame7,
    hasHomeCourt,
  )

  // DNP games (Injury Prone) don't drag down the series averages
  const played = games.filter((g) => !g.dnp)
  const n = Math.max(played.length, 1)
  const avg = (f: (g: SeriesGame) => number) =>
    round1(played.reduce((s, g) => s + f(g), 0) / n)

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
