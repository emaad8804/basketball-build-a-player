import { FLAW_BY_ID } from '../constants/flaws'
import type { ActiveFlaw } from './profile'

/**
 * Numeric hooks the Fatal Flaw exposes to the sims. All values are
 * pre-multiplied by the softening multiplier (0.5 when the linked
 * attribute is 95+), so callers just add them in.
 */

/** Playoff composite strength delta (Playoff Shrink: −4 ≈ −8% win prob). */
export function flawStrengthDelta(flaw: ActiveFlaw | null): number {
  if (flaw?.id !== 'playoff-shrink') return 0
  return -4 * flaw.mult
}

/** Per-game win-prob delta for regular series games. */
export function flawPGameDelta(
  flaw: ActiveFlaw | null,
  gameNumber: number,
): number {
  if (!flaw) return 0
  if (flaw.id === 'brick-at-the-line') return -0.04 * flaw.mult
  if (flaw.id === 'slow-starter' && gameNumber <= 2) return -0.12 * flaw.mult
  return 0
}

/** Game 7 win-prob delta. */
export function flawPGame7Delta(flaw: ActiveFlaw | null): number {
  if (!flaw) return 0
  if (flaw.id === 'brick-at-the-line') return -0.06 * flaw.mult
  if (flaw.id === 'ice-cold') return -0.2 * flaw.mult
  return 0
}

/** Injury Prone: chance after each game played to sit the next two. */
export function injuryPerGameChance(flaw: ActiveFlaw | null): number {
  if (flaw?.id !== 'injury-prone') return 0
  return 0.08 * flaw.mult
}

/** Glass Bones: chance entering each round that the season ends. */
export function glassBonesRoundChance(flaw: ActiveFlaw | null): number {
  if (flaw?.id !== 'glass-bones') return 0
  return 0.12 * flaw.mult
}

/** Roll Glass Bones for one round entry. */
export function rollGlassBones(flaw: ActiveFlaw | null): boolean {
  return Math.random() < glassBonesRoundChance(flaw)
}

/** Display name helper for sim event lines. */
export function flawLabel(flaw: ActiveFlaw): string {
  const f = FLAW_BY_ID[flaw.id]
  return `${f.emoji} ${f.name}`
}
