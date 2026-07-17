import type {
  FinalsResult,
  PlayoffResult,
  SeasonResult,
} from '../types'
import { ATTRIBUTE_KEYS } from '../constants/attributes'
import type { BuildProfile } from './profile'

export interface LegacyContext {
  /** Run went through the play-in tournament. */
  viaPlayIn?: boolean
  /** Glass Bones struck on play-in night. */
  playInInjury?: boolean
}

/**
 * Every label deriveLegacyLabel can return (LEGACY_LABELS.md taxonomy).
 * The canonical registry: legacy-check and any future label→color or
 * label→description map key off this list.
 */
export const LEGACY_LABELS = [
  // Injury what-if
  'What Could Have Been',
  'Star-Crossed Season',
  // Underdog title
  'Ultimate Underdog',
  // Champion tier
  'First Ballot Hall of Famer',
  'All-Time Great',
  'Playoff Legend',
  'Two-Way Superstar',
  'Defensive Anchor',
  'Offensive Engine',
  'The Closer',
  'Positionless King',
  'Unicorn',
  'Iron Throne',
  'Finals MVP',
  'Championship Piece',
  // Reached the Finals, lost
  'Heartbreak in June',
  'Conference Crown',
  'Almost a Champion',
  // Play-in story
  'Play-In Warrior',
  // Conference Finals exit
  'Prime Time Problem',
  'One Series Away',
  // Individual honors / season-vs-playoffs
  'MVP-Caliber Superstar',
  'Playoff Disappointment',
  'Regular Season Hero',
  'Regular Season Superstar',
  // Build identity
  'Lockdown',
  'The Wall',
  'Walking Bucket',
  'Sniper',
  'The Maestro',
  'Highlight Reel',
  'Glass Cleaner',
  'Two-Way Terror',
  'Stat Sheet Stuffer',
  // Big numbers / high-overall catches
  'Empty Numbers',
  'Franchise Player',
  'All-NBA Talent',
  // Early/quiet playoff exits
  'First-Round Casualty',
  // Missed playoffs, promising piece
  'Building Block',
  // Raised floor (shape before status)
  '3-and-D Specialist',
  'Specialist',
  'Glue Guy',
  'Solid Starter',
  'Playoff Regular',
  'Lottery Bound',
  'Rotation Piece',
] as const

export type LegacyLabel = (typeof LEGACY_LABELS)[number]

/**
 * Ordered rule-chain from LEGACY_LABELS.md §4 — first match wins, most
 * prestigious/specific first. Outcome prestige (ring > finals > CF > deep
 * run) outranks build identity; the identity tier sits ABOVE the coarse
 * overall fallbacks so a great build that fell short reads as a character,
 * not "Solid Starter". Deterministic: no RNG, same inputs → same label
 * (the Daily Challenge depends on this).
 */
export function deriveLegacyLabel(
  profile: BuildProfile,
  season: SeasonResult,
  playoffs: PlayoffResult | null,
  finals: FinalsResult | null,
  ctx: LegacyContext = {},
): LegacyLabel {
  const { overall, ratings } = profile
  const R = ratings
  const champion = finals?.won ?? false
  const finalsMvp = finals?.finalsMvp ?? false
  const reachedFinals = playoffs?.reachedFinals ?? false
  const lostEarly =
    playoffs !== null &&
    (playoffs.eliminatedIn === 'First Round' ||
      playoffs.eliminatedIn === 'Second Round')
  const cfExit = playoffs?.eliminatedIn === 'Conference Finals'
  const elitePlayoffStats =
    playoffs !== null &&
    playoffs.playoffStats.ppg >= 28 &&
    playoffs.playoffStats.ppg + playoffs.playoffStats.apg * 2 >= 40
  const eliteOffTrio =
    R.shooting >= 90 && R.ballHandling >= 90 && R.playmaking >= 86
  const anchorDefense = R.defense >= 94 // champ-tier bar (pre-expansion)

  // Build-shape helpers (LEGACY_LABELS.md §2)
  const eliteShooting = R.shooting >= 95
  const eliteDefense = R.defense >= 95
  const elitePlaymaking = R.playmaking >= 90
  const eliteClutch = R.iqClutch >= 95
  const eliteAthleticism = R.athleticism >= 90
  const eliteRebounding = R.rebounding >= 90
  const eliteFinishing = R.finishing >= 90
  const twoWay = R.shooting >= 90 && R.defense >= 90
  const threeAndD = R.shooting >= 87 && R.defense >= 87 // lower bar than twoWay
  const allAround = ATTRIBUTE_KEYS.filter((k) => R[k] >= 87).length >= 6
  // single dominant skill: best attr towers over the field
  const sorted = ATTRIBUTE_KEYS.map((k) => R[k]).sort((a, b) => b - a)
  const oneDimensional = sorted[0] - sorted[2] >= 12

  // 1. Glass Bones ended the run — the great what-if outranks everything
  if (playoffs?.seasonEndingInjury || ctx.playInInjury) {
    return overall >= 95 ? 'What Could Have Been' : 'Star-Crossed Season'
  }

  // 2. A title from the play-in lane is the greatest story in basketball
  if (champion && ctx.viaPlayIn) return 'Ultimate Underdog'

  // 3. Champion tier
  if (champion && finalsMvp && season.wonMvp) return 'First Ballot Hall of Famer'
  if (champion && finalsMvp && overall >= 97) return 'All-Time Great'
  if (champion && elitePlayoffStats) return 'Playoff Legend'
  if (champion && anchorDefense) {
    return R.shooting >= 86 ? 'Two-Way Superstar' : 'Defensive Anchor'
  }
  if (champion && eliteOffTrio) return 'Offensive Engine'
  if (champion && finalsMvp && eliteClutch) return 'The Closer'
  if (champion && allAround) return 'Positionless King'
  if (champion && profile.group === 'Centers' && eliteShooting && eliteDefense)
    return 'Unicorn'
  if (champion && overall >= 94 && !profile.flaw) return 'Iron Throne'
  if (champion && finalsMvp) return 'Finals MVP'
  if (champion) return 'Championship Piece'

  // 4. Reached the Finals, lost
  if (reachedFinals && finals && finals.winsFor === 3 && finals.winsAgainst === 4)
    return 'Heartbreak in June'
  if (reachedFinals && season.wins >= 55) return 'Conference Crown'
  if (reachedFinals) return 'Almost a Champion'

  // 5. Survived the play-in and still made a deep run
  if (ctx.viaPlayIn && cfExit) return 'Play-In Warrior'

  // 6. Conference Finals exit (specific before the tier default)
  if (cfExit && eliteClutch) return 'Prime Time Problem'
  if (cfExit) return 'One Series Away'

  // 7. Individual honors
  if (season.wonMvp) return 'MVP-Caliber Superstar'

  // 8. Regular season vs playoffs
  if (lostEarly && overall >= 95) return 'Playoff Disappointment'
  if (lostEarly && season.wins >= 55) return 'Regular Season Hero'
  if (lostEarly && season.stats.ppg >= 28) return 'Regular Season Superstar'

  // 9. Build identity — the "great build, no deep run" rescue. Sits ABOVE
  // the coarse overall fallbacks by design (LEGACY_LABELS.md §4).
  if (eliteDefense && R.defense >= 97) return 'Lockdown'
  if (eliteDefense) return 'The Wall'
  if (
    eliteShooting &&
    (season.stats.ppg >= 28 || (playoffs?.playoffStats.ppg ?? 0) >= 28)
  )
    return 'Walking Bucket'
  if (eliteShooting) return 'Sniper'
  if (elitePlaymaking && eliteClutch) return 'The Maestro'
  if (eliteAthleticism && eliteFinishing) return 'Highlight Reel'
  if (eliteRebounding) return 'Glass Cleaner'
  if (twoWay) return 'Two-Way Terror'
  if (allAround) return 'Stat Sheet Stuffer'

  // 10. Big numbers that never mattered, then the high-overall catch
  if (season.stats.ppg >= 27 && playoffs === null) return 'Empty Numbers'
  if (overall >= 96) return 'Franchise Player'

  // 11. League honors
  if (season.allNba !== null) return 'All-NBA Talent'

  // 12. Early playoff flameout with nothing else to say
  if (playoffs !== null && playoffs.eliminatedIn === 'First Round')
    return 'First-Round Casualty'

  // 13. Missed the bracket but the piece is real
  if (playoffs === null && overall >= 91) return 'Building Block'

  // 14. Raised floor — shape and a genuine mid-tier outrank the bare
  // status fallbacks, so 'Playoff Regular'/'Lottery Bound' are reserved
  // for shapeless sub-82 builds and 'Solid Starter' stays reachable.
  if (threeAndD) return '3-and-D Specialist'
  if (oneDimensional) return 'Specialist'
  if (allAround) return 'Glue Guy'
  if (overall >= 85) return 'Solid Starter'
  if (playoffs !== null) return 'Playoff Regular'
  if (!season.madePlayoffs) return 'Lottery Bound'
  return 'Rotation Piece'
}
