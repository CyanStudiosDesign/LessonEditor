import type {
  Activity,
  ActivityType,
  Curriculum,
  Lesson,
  Unit,
} from '@/types/curriculum'
import { uniqueId } from '@/lib/utils'

export function allUnitIds(curriculum: Curriculum): string[] {
  return curriculum.units.map((unit) => unit.id)
}

export function allLessonIds(curriculum: Curriculum): string[] {
  return curriculum.lessons.map((lesson) => lesson.id)
}

export function allActivityIds(curriculum: Curriculum): string[] {
  return curriculum.lessons.flatMap((lesson) =>
    lesson.activities.map((activity) => activity.id),
  )
}

/** Sequential id in the `<lesson>-01` house style, skipping anything taken. */
export function nextActivityId(lessonId: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = lessonId || 'activity'
  for (let n = 1; n < 1000; n += 1) {
    const candidate = `${base}-${String(n).padStart(2, '0')}`
    if (!used.has(candidate)) return candidate
  }
  return uniqueId(`${base}-activity`, used)
}

export function makeActivity(
  type: ActivityType,
  lessonId: string,
  taken: Iterable<string>,
): Activity {
  const id = nextActivityId(lessonId, taken)
  switch (type) {
    case 'explanation':
      return { id, type, title: 'New explanation', content: '' }
    case 'multiple_choice':
      return {
        id,
        type,
        title: 'New question',
        question: '',
        options: ['', ''],
        answer: 0,
      }
    case 'true_false':
      return { id, type, title: 'New true / false', statement: '', answer: true }
    case 'fill_blank':
      return { id, type, title: 'New fill blank', prompt: '', answer: '' }
  }
}

export function makeLesson(curriculum: Curriculum): Lesson {
  const id = uniqueId('new-lesson', allLessonIds(curriculum))
  const maxOrder = curriculum.lessons.reduce(
    (max, lesson) => (Number.isFinite(lesson.order) ? Math.max(max, lesson.order) : max),
    0,
  )
  return {
    id,
    title: 'New Lesson',
    description: '',
    skill: '',
    estimatedMinutes: 3,
    order: maxOrder + 1,
    icon: '📘',
    activities: [],
  }
}

export function makeUnit(curriculum: Curriculum): Unit {
  return {
    id: uniqueId('new-unit', allUnitIds(curriculum)),
    title: 'New Unit',
    iconKey: 'foundations',
    lessonIds: [],
  }
}

/** Re-ids a lesson (and its activities) so it can live beside the original. */
export function cloneLesson(lesson: Lesson, curriculum: Curriculum): Lesson {
  const newId = uniqueId(`${lesson.id}-copy`, allLessonIds(curriculum))
  const taken = new Set(allActivityIds(curriculum))
  const activities = lesson.activities.map((activity) => {
    const id = nextActivityId(newId, taken)
    taken.add(id)
    return { ...activity, id }
  })
  const maxOrder = curriculum.lessons.reduce(
    (max, item) => (Number.isFinite(item.order) ? Math.max(max, item.order) : max),
    0,
  )
  return {
    ...lesson,
    id: newId,
    title: `${lesson.title} (copy)`,
    order: maxOrder + 1,
    activities,
  }
}

export function cloneUnit(unit: Unit, curriculum: Curriculum): Unit {
  return {
    ...unit,
    id: uniqueId(`${unit.id}-copy`, allUnitIds(curriculum)),
    title: `${unit.title} (copy)`,
    lessonIds: [...unit.lessonIds],
  }
}
