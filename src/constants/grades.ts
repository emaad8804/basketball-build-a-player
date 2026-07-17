import type { Grade } from '../types'

export const GRADE_TO_RATING: Record<Grade, number> = {
  S: 99,
  'A+': 96,
  A: 93,
  'A-': 89,
  'B+': 85,
  B: 81,
  'B-': 77,
  'C+': 73,
  C: 68,
  D: 62,
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
