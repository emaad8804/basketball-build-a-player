import { GRADE_RANK, GRADE_TO_RATING } from '../constants/grades'
import type { Grade } from '../types'

export function convertGradeToRating(grade: Grade): number {
  return GRADE_TO_RATING[grade]
}

/** True if `grade` is at least as good as `minGrade`. */
export function gradeAtLeast(grade: Grade, minGrade: Grade): boolean {
  return GRADE_RANK[grade] >= GRADE_RANK[minGrade]
}

export function gradeRank(grade: Grade): number {
  return GRADE_RANK[grade]
}
