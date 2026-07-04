import type {
  FinalsResult,
  PlayoffResult,
  SeasonResult,
} from '../types'
import type { BuildProfile } from './profile'

export interface LegacyContext {
  /** Run went through the play-in tournament. */
  viaPlayIn?: boolean
  /** Glass Bones struck on play-in night. */
  playInInjury?: boolean
}

/**
 * Ordered rule-chain from the spec — first match wins.
 */
export function deriveLegacyLabel(
  profile: BuildProfile,
  season: SeasonResult,
  playoffs: PlayoffResult | null,
  finals: FinalsResult | null,
  ctx: LegacyContext = {},
): string {
  const { overall, ratings } = profile
  const champion = finals?.won ?? false
  const finalsMvp = finals?.finalsMvp ?? false
  const reachedFinals = playoffs?.reachedFinals ?? false
  const lostEarly =
    playoffs !== null &&
    (playoffs.eliminatedIn === 'First Round' ||
      playoffs.eliminatedIn === 'Second Round')
  const elitePlayoffStats =
    playoffs !== null &&
    playoffs.playoffStats.ppg >= 28 &&
    playoffs.playoffStats.ppg + playoffs.playoffStats.apg * 2 >= 40
  const eliteOffTrio =
    ratings.shooting >= 90 && ratings.ballHandling >= 90 && ratings.playmaking >= 86
  const eliteDefense = ratings.defense >= 94

  // Glass Bones ended the run — the great what-if outranks everything else
  if (playoffs?.seasonEndingInjury || ctx.playInInjury) {
    return overall >= 93 ? 'What Could Have Been' : 'Star-Crossed Season'
  }

  // A title from the play-in lane is the greatest story in basketball
  if (champion && ctx.viaPlayIn) return 'Ultimate Underdog'

  if (champion && finalsMvp && season.wonMvp) return 'First Ballot Hall of Famer'
  if (champion && finalsMvp && overall >= 95) return 'All-Time Great'
  if (champion && elitePlayoffStats) return 'Playoff Legend'
  if (champion && eliteDefense) {
    return ratings.shooting >= 86 ? 'Two-Way Superstar' : 'Defensive Anchor'
  }
  if (champion && eliteOffTrio) return 'Offensive Engine'
  if (champion && finalsMvp) return 'Finals MVP'
  if (champion) return 'Championship Piece'
  if (reachedFinals) return 'Almost a Champion'
  // Survived the play-in and still made a deep run
  if (
    ctx.viaPlayIn &&
    playoffs !== null &&
    playoffs.eliminatedIn === 'Conference Finals'
  )
    return 'Play-In Warrior'
  if (season.wonMvp) return 'MVP-Caliber Superstar'
  if (lostEarly && overall >= 93) return 'Playoff Disappointment'
  if (lostEarly && season.stats.ppg >= 28) return 'Regular Season Superstar'
  if (overall >= 94) return 'Franchise Player'
  if (season.allNba !== null) return 'All-NBA Talent'
  if (overall >= 90) return 'Regular Season Superstar'
  return 'Solid Starter'
}
