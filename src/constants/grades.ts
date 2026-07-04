import type { Grade } from '../types'

export const GRADE_TO_RATING: Record<Grade, number> = {
  S: 99,
  'A+': 94,
  A: 90,
  'A-': 86,
  'B+': 82,
  B: 78,
  'B-': 74,
  'C+': 70,
  C: 66,
  D: 60,
}

/** Higher rank = better grade. Used for threshold comparisons like "A- or higher". */
export const GRADE_RANK: Record<Grade, number> = {
  S: 10,
  'A+': 9,
  A: 8,
  'A-': 7,
  'B+': 6,
  B: 5,
  'B-': 4,
  'C+': 3,
  C: 2,
  D: 1,
}

export const GRADES_ORDERED: Grade[] = [
  'S',
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'D',
]
