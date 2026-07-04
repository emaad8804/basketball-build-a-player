import { FLAWS, NO_FLAW_WEIGHT } from '../constants/flaws'
import type { FlawId } from '../constants/flaws'
import type { Rand } from './rng'

/**
 * The mandatory 10th spin. Returns null for No Flaw (65%) or a flaw id
 * from the weighted pool (35% total). A Respin-funded reroll runs this
 * exact function again on the full wheel — Respins are true insurance.
 */
export function spinFlaw(rand: Rand): FlawId | null {
  const total = NO_FLAW_WEIGHT + FLAWS.reduce((s, f) => s + f.weight, 0)
  let roll = rand() * total
  roll -= NO_FLAW_WEIGHT
  if (roll <= 0) return null
  for (const flaw of FLAWS) {
    roll -= flaw.weight
    if (roll <= 0) return flaw.id
  }
  return null
}
