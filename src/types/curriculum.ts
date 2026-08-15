/**
 * Canonical curriculum model.
 *
 * These types mirror the exported JSON file 1:1. The application state IS this
 * shape — there is no separate internal model, no normalisation layer, and no
 * conversion step on import/export.
 *
 *   {
 *     "chapter": { ... },
 *     "units":   [ ... ],   // reference lessons by id via `lessonIds`
 *     "lessons": [ ... ]    // own their activities inline
 *   }
 */

export const ACTIVITY_TYPES = [
  'explanation',
  'multiple_choice',
  'true_false',
  'fill_blank',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export interface Chapter {
  id: string
  title: string
  description: string
  number: number
}

export interface Unit {
  id: string
  title: string
  iconKey: string
  lessonIds: string[]
  /** Optional — only serialised when true. */
  isBoss?: boolean
}

export interface ExplanationActivity {
  id: string
  type: 'explanation'
  title: string
  content: string
  /** Optional. */
  visual?: string
}

export interface MultipleChoiceActivity {
  id: string
  type: 'multiple_choice'
  title: string
  question: string
  options: string[]
  /** Zero-based index into `options`. */
  answer: number
  /** Optional. */
  explanation?: string
  /** Optional. */
  hint?: string
}

export interface TrueFalseActivity {
  id: string
  type: 'true_false'
  title: string
  statement: string
  answer: boolean
  /** Optional. */
  explanation?: string
  /** Optional. */
  hint?: string
}

export interface FillBlankActivity {
  id: string
  type: 'fill_blank'
  title: string
  prompt: string
  answer: string
  /** Optional. */
  acceptableAnswers?: string[]
  /** Optional. */
  hint?: string
  /** Optional. */
  explanation?: string
}

export type Activity =
  | ExplanationActivity
  | MultipleChoiceActivity
  | TrueFalseActivity
  | FillBlankActivity

export interface Lesson {
  id: string
  title: string
  description: string
  skill: string
  estimatedMinutes: number
  order: number
  icon: string
  /** Optional — only serialised when true. */
  isBoss?: boolean
  activities: Activity[]
}

export interface Curriculum {
  chapter: Chapter
  units: Unit[]
  lessons: Lesson[]
}

/** What is currently focused in the workspace. */
export type Selection =
  | { kind: 'chapter' }
  | { kind: 'unit'; unitId: string }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'activity'; lessonId: string; activityId: string }

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  explanation: 'Explanation',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill Blank',
}
