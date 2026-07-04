import {
  PLAYOFF_WIN_CUTOFF,
  SEASON_VARIANCE_STD,
  WIN_PCT_ANCHORS,
} from '../constants/weights'
import type { Group, SeasonResult, StatLine } from '../types'
import { clamp, gaussian, lerpAnchors, round1 } from './random'
import type { BuildProfile } from './profile'

/** Per-group baseline stat lines for a star-level (85-ish) build. */
const BASE_STATS: Record<Group, StatLine> = {
  Guards: { ppg: 22, rpg: 4, apg: 6, spg: 1.1, bpg: 0.3, fgPct: 45, threePct: 35 },
  Forwards: { ppg: 21, rpg: 6.5, apg: 4, spg: 1.0, bpg: 0.6, fgPct: 47, threePct: 34 },
  Centers: { ppg: 19, rpg: 10, apg: 3, spg: 0.8, bpg: 1.4, fgPct: 53, threePct: 30 },
}

/** How strongly each driving attribute pulls its stat, per rating point above/below 70. */
const K = {
  ppgShoot: 0.28,
  ppgFinish: 0.18,
  ppgOverall: 0.1,
  rpgRebound: 0.18,
  rpgFrame: 0.05,
  apgPlaymaking: 0.16,
  apgHandling: 0.05,
  spgDefense: 0.03,
  bpgDefense: 0.03,
  bpgFrame: 0.02,
  fgFinish: 0.14,
  fgFrame: 0.06,
  threeShoot: 0.28,
}

export function generateStatLine(
  profile: BuildProfile,
  multiplier = 1,
  noiseScale = 1,
): StatLine {
  const r = profile.ratings
  const d = (rating: number) => rating - 70

  const ppg =
    (BASE_STATS[profile.group].ppg +
      d(r.shooting) * K.ppgShoot +
      d(r.finishing) * K.ppgFinish +
      (profile.overall - 70) * K.ppgOverall) *
      multiplier +
    gaussian(0, 1.2 * noiseScale)
  const rpg =
    (BASE_STATS[profile.group].rpg +
      d(r.rebounding) * K.rpgRebound +
      d(r.frame) * K.rpgFrame) *
      multiplier +
    gaussian(0, 0.7 * noiseScale)
  const apg =
    (BASE_STATS[profile.group].apg +
      d(r.playmaking) * K.apgPlaymaking +
      d(r.ballHandling) * K.apgHandling) *
      multiplier +
    gaussian(0, 0.6 * noiseScale)
  const spg =
    BASE_STATS[profile.group].spg +
    d(r.defense) * K.spgDefense +
    gaussian(0, 0.15 * noiseScale)
  const bpg =
    BASE_STATS[profile.group].bpg +
    d(r.defense) * K.bpgDefense +
    d(r.frame) * K.bpgFrame +
    gaussian(0, 0.2 * noiseScale)
  const fgPct =
    BASE_STATS[profile.group].fgPct +
    d(r.finishing) * K.fgFinish +
    d(r.frame) * K.fgFrame +
    gaussian(0, 1.2 * noiseScale)
  const threePct =
    BASE_STATS[profile.group].threePct +
    d(r.shooting) * K.threeShoot +
    gaussian(0, 1.5 * noiseScale)

  return {
    ppg: round1(clamp(ppg, 8, 38)),
    rpg: round1(clamp(rpg, 2, 16)),
    apg: round1(clamp(apg, 1, 12.5)),
    spg: round1(clamp(spg, 0.3, 2.8)),
    bpg: round1(clamp(bpg, 0.1, 3.5)),
    fgPct: round1(clamp(fgPct, 39, 66)),
    threePct: round1(clamp(threePct, 24, 45)),
  }
}

export function simulateSeason(profile: BuildProfile): SeasonResult {
  const { overall, ratings } = profile

  // Record: overall-anchored win% + clutch tilt + noise
  const iqTilt = ((ratings.iqClutch - 78) / 100) * 0.25
  const playmakingTilt = ((ratings.playmaking - 78) / 100) * 0.1
  const winPct = clamp(
    lerpAnchors(WIN_PCT_ANCHORS, overall) +
      iqTilt +
      playmakingTilt +
      profile.teamWinPctDelta +
      gaussian(0, SEASON_VARIANCE_STD),
    0.12,
    0.93,
  )
  const wins = Math.round(winPct * 82)
  const losses = 82 - wins

  // Seed: derived from wins with light jitter. Hard gate: below the win
  // cutoff the season is over — no play-in mercy, straight to the lottery.
  let seed: number
  if (wins < PLAYOFF_WIN_CUTOFF) {
    seed =
      wins >= 39
        ? 9 + Math.floor(Math.random() * 2)
        : 11 + Math.floor(Math.random() * 4)
  } else {
    if (wins >= 58) seed = 1
    else if (wins >= 53) seed = 2
    else if (wins >= 49) seed = 3
    else if (wins >= 46) seed = 4
    else seed = 5 + Math.floor(Math.random() * 4)
    if (seed >= 2 && seed <= 5 && Math.random() < 0.3) seed += Math.random() < 0.5 ? -1 : 1
    seed = clamp(seed, 1, 8)
  }

  const madePlayoffs = wins >= PLAYOFF_WIN_CUTOFF
  // One last chance: 40-43 wins earns a sudden-death play-in berth
  const playInEligible = !madePlayoffs && wins >= 40
  // Conference comes from the Team Destiny landing when there is one
  const conference: 'East' | 'West' =
    profile.homeConference ?? (Math.random() < 0.5 ? 'East' : 'West')

  const stats = generateStatLine(profile)

  // Awards
  const awards: string[] = []
  const allStar = overall >= 90 ? Math.random() < 0.92 : overall >= 87 ? Math.random() < 0.55 : Math.random() < 0.15
  if (allStar) awards.push('All-Star')

  let allNba: string | null = null
  if (overall >= 96 && madePlayoffs) allNba = 'All-NBA First Team'
  else if (overall >= 94) allNba = Math.random() < 0.7 ? 'All-NBA First Team' : 'All-NBA Second Team'
  else if (overall >= 91) allNba = Math.random() < 0.6 ? 'All-NBA Second Team' : 'All-NBA Third Team'
  else if (overall >= 89 && madePlayoffs && Math.random() < 0.5) allNba = 'All-NBA Third Team'
  if (allNba) awards.push(allNba)

  let defensiveAward: string | null = null
  if (ratings.defense >= 94) {
    defensiveAward = Math.random() < 0.55 ? 'Defensive Player of the Year' : 'All-Defensive First Team'
  } else if (ratings.defense >= 90) {
    defensiveAward = Math.random() < 0.6 ? 'All-Defensive First Team' : 'All-Defensive Second Team'
  } else if (ratings.defense >= 86 && Math.random() < 0.4) {
    defensiveAward = 'All-Defensive Second Team'
  }
  if (defensiveAward) awards.push(defensiveAward)

  // MVP voting: overall + wins + clutch driven
  const mvpScore =
    (overall - 88) * 2 + (wins - 45) * 0.5 + (ratings.iqClutch - 80) * 0.3 + gaussian(0, 2)
  let mvpVoting: string
  let wonMvp = false
  if (mvpScore >= 20) {
    wonMvp = true
    mvpVoting = 'Won MVP'
  } else if (mvpScore >= 15) {
    wonMvp = Math.random() < 0.45
    mvpVoting = wonMvp ? 'Won MVP' : '2nd in MVP voting'
  } else if (mvpScore >= 10) mvpVoting = `${Math.random() < 0.5 ? '2nd' : '3rd'} in MVP voting`
  else if (mvpScore >= 5) mvpVoting = `Top-5 in MVP voting`
  else if (mvpScore >= 0) mvpVoting = 'Received MVP votes'
  else mvpVoting = 'No MVP votes'
  if (wonMvp) awards.unshift('MVP')

  return {
    wins,
    losses,
    seed,
    playInEligible,
    conference,
    stats,
    awards,
    mvpVoting,
    allNba,
    defensiveAward,
    wonMvp,
    madePlayoffs,
  }
}
