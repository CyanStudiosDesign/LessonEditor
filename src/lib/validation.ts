import { ACTIVITY_TYPES } from '@/types/curriculum'
import type { Activity, Curriculum, Selection } from '@/types/curriculum'

export type IssueSeverity = 'error' | 'warning'

export interface ValidationIssue {
  key: string
  severity: IssueSeverity
  /** e.g. "Unit: Array Foundations" */
  scope: string
  message: string
  /** Where to navigate when the issue is clicked. */
  target: Selection
}

export interface ValidationReport {
  issues: ValidationIssue[]
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  valid: boolean
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function activityIssues(
  activity: Activity,
  lessonId: string,
  lessonTitle: string,
  index: number,
  push: (issue: Omit<ValidationIssue, 'target'> & { target?: Selection }) => void,
) {
  const scope = `Lesson: ${lessonTitle || lessonId}`
  const label = activity.id || `activity #${index + 1}`
  const target: Selection = {
    kind: 'activity',
    lessonId,
    activityId: activity.id,
  }
  const at = (suffix: string, severity: IssueSeverity, message: string) =>
    push({
      key: `activity:${lessonId}:${activity.id || index}:${suffix}`,
      severity,
      scope,
      message,
      target,
    })

  if (blank(activity.id)) {
    at('id', 'error', `Activity #${index + 1} is missing an id.`)
  }
  if (!ACTIVITY_TYPES.includes(activity.type)) {
    at(
      'type',
      'error',
      `Activity ${label} has an invalid type "${String(activity.type)}".`,
    )
    return
  }
  if (blank(activity.title)) {
    at('title', 'error', `Activity ${label} is missing a title.`)
  }

  switch (activity.type) {
    case 'explanation': {
      if (blank(activity.content)) {
        at('content', 'error', `Activity ${label} has no content.`)
      }
      break
    }
    case 'multiple_choice': {
      if (blank(activity.question)) {
        at('question', 'error', `Activity ${label} has no question.`)
      }
      if (activity.options.length < 2) {
        at(
          'options',
          'error',
          `Activity ${label} needs at least 2 options (has ${activity.options.length}).`,
        )
      }
      if (
        !Number.isInteger(activity.answer) ||
        activity.answer < 0 ||
        activity.answer >= activity.options.length
      ) {
        at(
          'answer',
          'error',
          `Activity ${label} has an invalid answer index (${activity.answer}).`,
        )
      }
      if (activity.options.some((option) => blank(option))) {
        at('empty-option', 'warning', `Activity ${label} has an empty option.`)
      }
      const seen = new Set<string>()
      for (const option of activity.options) {
        if (seen.has(option)) {
          at(
            'duplicate-option',
            'warning',
            `Activity ${label} has duplicate options.`,
          )
          break
        }
        seen.add(option)
      }
      break
    }
    case 'true_false': {
      if (blank(activity.statement)) {
        at('statement', 'error', `Activity ${label} has no statement.`)
      }
      if (typeof activity.answer !== 'boolean') {
        at('answer', 'error', `Activity ${label} has a non-boolean answer.`)
      }
      break
    }
    case 'fill_blank': {
      if (blank(activity.prompt)) {
        at('prompt', 'error', `Activity ${label} has no prompt.`)
      }
      if (blank(activity.answer)) {
        at('answer', 'error', `Activity ${label} has no answer.`)
      }
      break
    }
  }
}

/**
 * Full-curriculum validation. Errors block export; warnings do not.
 */
export function validateCurriculum(curriculum: Curriculum): ValidationReport {
  const issues: ValidationIssue[] = []
  const push = (
    issue: Omit<ValidationIssue, 'target'> & { target?: Selection },
  ) => {
    issues.push({ ...issue, target: issue.target ?? { kind: 'chapter' } })
  }

  const { chapter, units, lessons } = curriculum

  /* ---- chapter ---- */
  if (blank(chapter?.id)) {
    push({
      key: 'chapter:id',
      severity: 'error',
      scope: 'Chapter',
      message: 'Chapter is missing an id.',
      target: { kind: 'chapter' },
    })
  }
  if (blank(chapter?.title)) {
    push({
      key: 'chapter:title',
      severity: 'error',
      scope: 'Chapter',
      message: 'Chapter is missing a title.',
      target: { kind: 'chapter' },
    })
  }
  if (!Number.isFinite(chapter?.number)) {
    push({
      key: 'chapter:number',
      severity: 'error',
      scope: 'Chapter',
      message: 'Chapter number must be a number.',
      target: { kind: 'chapter' },
    })
  }

  /* ---- lessons ---- */
  const lessonById = new Map<string, (typeof lessons)[number]>()
  const seenLessonIds = new Set<string>()
  const globalActivityIds = new Map<string, string>()

  for (const [index, lesson] of lessons.entries()) {
    const target: Selection = { kind: 'lesson', lessonId: lesson.id }
    const scope = `Lesson: ${lesson.title || lesson.id || `#${index + 1}`}`

    if (blank(lesson.id)) {
      push({
        key: `lesson:${index}:id`,
        severity: 'error',
        scope,
        message: `Lesson #${index + 1} is missing an id.`,
        target,
      })
    } else if (seenLessonIds.has(lesson.id)) {
      push({
        key: `lesson:${index}:duplicate`,
        severity: 'error',
        scope,
        message: `Duplicate lesson id "${lesson.id}".`,
        target,
      })
    } else {
      seenLessonIds.add(lesson.id)
      lessonById.set(lesson.id, lesson)
    }

    if (blank(lesson.title)) {
      push({
        key: `lesson:${index}:title`,
        severity: 'error',
        scope,
        message: 'Lesson is missing a title.',
        target,
      })
    }
    if (!Number.isFinite(lesson.estimatedMinutes) || lesson.estimatedMinutes < 0) {
      push({
        key: `lesson:${index}:minutes`,
        severity: 'error',
        scope,
        message: 'Estimated minutes must be a non-negative number.',
        target,
      })
    }
    if (!Number.isFinite(lesson.order)) {
      push({
        key: `lesson:${index}:order`,
        severity: 'error',
        scope,
        message: 'Lesson order must be a number.',
        target,
      })
    }
    if (lesson.activities.length === 0) {
      push({
        key: `lesson:${index}:empty`,
        severity: 'warning',
        scope,
        message: 'Lesson has no activities.',
        target,
      })
    }

    const seenActivityIds = new Set<string>()
    for (const [activityIndex, activity] of lesson.activities.entries()) {
      if (!blank(activity.id)) {
        if (seenActivityIds.has(activity.id)) {
          push({
            key: `activity:${lesson.id}:${activity.id}:duplicate`,
            severity: 'error',
            scope,
            message: `Duplicate activity id "${activity.id}" inside this lesson.`,
            target: {
              kind: 'activity',
              lessonId: lesson.id,
              activityId: activity.id,
            },
          })
        } else {
          seenActivityIds.add(activity.id)
          const owner = globalActivityIds.get(activity.id)
          if (owner && owner !== lesson.id) {
            push({
              key: `activity:${lesson.id}:${activity.id}:global-duplicate`,
              severity: 'warning',
              scope,
              message: `Activity id "${activity.id}" is also used in lesson "${owner}".`,
              target: {
                kind: 'activity',
                lessonId: lesson.id,
                activityId: activity.id,
              },
            })
          } else {
            globalActivityIds.set(activity.id, lesson.id)
          }
        }
      }
      activityIssues(
        activity,
        lesson.id,
        lesson.title,
        activityIndex,
        push,
      )
    }
  }

  /* ---- units ---- */
  const referenced = new Map<string, string[]>()
  const seenUnitIds = new Set<string>()

  for (const [index, unit] of units.entries()) {
    const target: Selection = { kind: 'unit', unitId: unit.id }
    const scope = `Unit: ${unit.title || unit.id || `#${index + 1}`}`

    if (blank(unit.id)) {
      push({
        key: `unit:${index}:id`,
        severity: 'error',
        scope,
        message: `Unit #${index + 1} is missing an id.`,
        target,
      })
    } else if (seenUnitIds.has(unit.id)) {
      push({
        key: `unit:${index}:duplicate`,
        severity: 'error',
        scope,
        message: `Duplicate unit id "${unit.id}".`,
        target,
      })
    } else {
      seenUnitIds.add(unit.id)
    }

    if (blank(unit.title)) {
      push({
        key: `unit:${index}:title`,
        severity: 'error',
        scope,
        message: 'Unit is missing a title.',
        target,
      })
    }
    if (unit.lessonIds.length === 0) {
      push({
        key: `unit:${index}:empty`,
        severity: 'warning',
        scope,
        message: 'Unit does not reference any lessons.',
        target,
      })
    }

    const seenInUnit = new Set<string>()
    for (const lessonId of unit.lessonIds) {
      if (seenInUnit.has(lessonId)) {
        push({
          key: `unit:${index}:dupref:${lessonId}`,
          severity: 'error',
          scope,
          message: `References lesson "${lessonId}" more than once.`,
          target,
        })
        continue
      }
      seenInUnit.add(lessonId)

      if (!lessonById.has(lessonId)) {
        push({
          key: `unit:${index}:missing:${lessonId}`,
          severity: 'error',
          scope,
          message: `References missing lesson: ${lessonId}`,
          target,
        })
      } else {
        referenced.set(lessonId, [...(referenced.get(lessonId) ?? []), unit.id])
      }
    }
  }

  /* ---- cross references ---- */
  for (const lesson of lessons) {
    if (blank(lesson.id)) continue
    const owners = referenced.get(lesson.id) ?? []
    const scope = `Lesson: ${lesson.title || lesson.id}`
    if (owners.length === 0) {
      push({
        key: `lesson:${lesson.id}:unreferenced`,
        severity: 'warning',
        scope,
        message: 'Lesson is not referenced by any unit.',
        target: { kind: 'lesson', lessonId: lesson.id },
      })
    } else if (owners.length > 1) {
      push({
        key: `lesson:${lesson.id}:multiref`,
        severity: 'warning',
        scope,
        message: `Lesson is referenced by ${owners.length} units (${owners.join(', ')}).`,
        target: { kind: 'lesson', lessonId: lesson.id },
      })
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return {
    issues: [...errors, ...warnings],
    errors,
    warnings,
    valid: errors.length === 0,
  }
}

export function countActivities(curriculum: Curriculum): number {
  return curriculum.lessons.reduce(
    (total, lesson) => total + lesson.activities.length,
    0,
  )
}
