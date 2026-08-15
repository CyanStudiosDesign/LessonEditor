import type { Curriculum, Selection } from '@/types/curriculum'
import { ACTIVITY_TYPE_LABELS } from '@/types/curriculum'

export interface SearchResult {
  key: string
  group: 'Chapter' | 'Unit' | 'Lesson' | 'Activity'
  title: string
  /** The matching text, with context. */
  context: string
  target: Selection
}

function matches(haystack: unknown, needle: string): boolean {
  return typeof haystack === 'string' && haystack.toLowerCase().includes(needle)
}

/** Searches titles, questions, statements, prompts, options and content. */
export function searchCurriculum(
  curriculum: Curriculum,
  query: string,
): SearchResult[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return []

  const results: SearchResult[] = []

  const { chapter, units, lessons } = curriculum

  if (matches(chapter.title, needle) || matches(chapter.description, needle)) {
    results.push({
      key: 'chapter',
      group: 'Chapter',
      title: chapter.title,
      context: chapter.description,
      target: { kind: 'chapter' },
    })
  }

  for (const unit of units) {
    if (matches(unit.title, needle) || matches(unit.id, needle)) {
      results.push({
        key: `unit:${unit.id}`,
        group: 'Unit',
        title: unit.title,
        context: `${unit.lessonIds.length} lessons · ${unit.id}`,
        target: { kind: 'unit', unitId: unit.id },
      })
    }
  }

  for (const lesson of lessons) {
    if (
      matches(lesson.title, needle) ||
      matches(lesson.description, needle) ||
      matches(lesson.skill, needle) ||
      matches(lesson.id, needle)
    ) {
      results.push({
        key: `lesson:${lesson.id}`,
        group: 'Lesson',
        title: lesson.title,
        context: lesson.description || lesson.id,
        target: { kind: 'lesson', lessonId: lesson.id },
      })
    }

    for (const activity of lesson.activities) {
      const haystacks: string[] = [activity.title, activity.id]
      switch (activity.type) {
        case 'explanation':
          haystacks.push(activity.content, activity.visual ?? '')
          break
        case 'multiple_choice':
          haystacks.push(activity.question, ...activity.options)
          break
        case 'true_false':
          haystacks.push(activity.statement)
          break
        case 'fill_blank':
          haystacks.push(activity.prompt, activity.answer)
          break
      }
      if ('explanation' in activity && activity.explanation) {
        haystacks.push(activity.explanation)
      }
      if ('hint' in activity && activity.hint) haystacks.push(activity.hint)

      const hit = haystacks.find((value) => matches(value, needle))
      if (hit) {
        results.push({
          key: `activity:${lesson.id}:${activity.id}`,
          group: 'Activity',
          title: activity.title,
          context: `${ACTIVITY_TYPE_LABELS[activity.type]} · ${lesson.title}`,
          target: { kind: 'activity', lessonId: lesson.id, activityId: activity.id },
        })
      }
    }
  }

  return results
}
