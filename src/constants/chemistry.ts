import type { AttributeKey, Grade } from '../types'

export interface ChemistryRule {
  name: string
  description: string
  /** Every listed attribute must meet its minimum grade. */
  conditions: { attribute: AttributeKey; minGrade: Grade }[]
  /** Bonus when conditions are met exactly at threshold level. */
  baseBonus: number
  /**
   * Bonus when the build clears the thresholds comfortably
   * (total grade-ranks at least `strongMargin` above the minimums).
   * Equal to baseBonus for fixed-value bonuses like Floor General.
   */
  strongBonus: number
  strongMargin: number
}

export const CHEMISTRY_RULES: ChemistryRule[] = [
  {
    name: 'Shot Creator',
    description: 'Elite shooting, handle, and playmaking package',
    conditions: [
      { attribute: 'shooting', minGrade: 'A' },
      { attribute: 'ballHandling', minGrade: 'A' },
      { attribute: 'playmaking', minGrade: 'A-' },
    ],
    baseBonus: 1,
    strongBonus: 2,
    strongMargin: 3,
  },
  {
    name: 'Defensive Anchor',
    description: 'Frame, defense, and glass control',
    conditions: [
      { attribute: 'frame', minGrade: 'A' },
      { attribute: 'defense', minGrade: 'A' },
      { attribute: 'rebounding', minGrade: 'A-' },
    ],
    baseBonus: 1,
    strongBonus: 2,
    strongMargin: 3,
  },
  {
    name: 'Slasher',
    description: 'Explosive downhill finishing',
    conditions: [
      { attribute: 'finishing', minGrade: 'A' },
      { attribute: 'athleticism', minGrade: 'A' },
      { attribute: 'frame', minGrade: 'B+' },
    ],
    baseBonus: 1,
    strongBonus: 2,
    strongMargin: 3,
  },
  {
    name: 'Floor General',
    description: 'Elite playmaking brain',
    conditions: [
      { attribute: 'playmaking', minGrade: 'A' },
      { attribute: 'iqClutch', minGrade: 'A' },
    ],
    baseBonus: 1,
    strongBonus: 1,
    strongMargin: 0,
  },
  {
    name: 'Two-Way Stretch',
    description: 'Shooting and defense in one frame',
    conditions: [
      { attribute: 'shooting', minGrade: 'A-' },
      { attribute: 'defense', minGrade: 'A-' },
      { attribute: 'frame', minGrade: 'B+' },
    ],
    baseBonus: 1,
    strongBonus: 2,
    strongMargin: 3,
  },
]

export const OVERALL_CAP = 99
