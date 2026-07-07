import {
  ArrowBigDownDash,
  Bandage,
  BrickWall,
  Construction,
  Crown,
  Flame,
  Lock,
  Mountain,
  Scale,
  Skull,
  Snail,
  Snowflake,
  TrendingDown,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { FlawId } from '../../constants/flaws'
import type { TeamTierId } from '../../constants/teamStrength'
import type { Group } from '../../types'

/**
 * Icon maps for the data-driven emoji slots (kill list §2.1). Kept out of
 * the constants modules so flaws.ts / teamStrength.ts stay React-free —
 * they're imported by the simulation and canvas code.
 */

export const FLAW_ICONS: Record<FlawId, LucideIcon> = {
  'brick-at-the-line': BrickWall,
  'slow-starter': Snail,
  'injury-prone': Bandage,
  'playoff-shrink': TrendingDown,
  'ice-cold': Snowflake,
  'glass-bones': Skull,
}

export const TIER_ICONS: Record<TeamTierId, LucideIcon> = {
  contender: Crown,
  'playoff-lock': Lock,
  middle: Scale,
  rebuilding: Construction,
  tanking: ArrowBigDownDash,
}

export const GROUP_ICONS: Record<Group, LucideIcon> = {
  Guards: Zap,
  Forwards: Flame,
  Centers: Mountain,
}
