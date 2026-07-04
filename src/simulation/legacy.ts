import type {
  FinalsResult,
  PlayoffResult,
  SeasonResult,
} from '../types'
import type { BuildProfile } from './profile'

/**
 * Ordered rule-chain from the spec — first match wins.
 */
export function deriveLegacyLabel(
  profile: BuildProfile,
  season: SeasonResult,
  playoffs: PlayoffResult | null,
  finals: FinalsResult | null,
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
  if (season.wonMvp) return 'MVP-Caliber Superstar'
  if (lostEarly && overall >= 93) return 'Playoff Disappointment'
  if (lostEarly && season.stats.ppg >= 28) return 'Regular Season Superstar'
  if (overall >= 94) return 'Franchise Player'
  if (season.allNba !== null) return 'All-NBA Talent'
  if (overall >= 90) return 'Regular Season Superstar'
  return 'Solid Starter'
}
