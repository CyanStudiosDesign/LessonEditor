import { describe, expect, it } from 'vitest'
import type { Curriculum, MultipleChoiceActivity } from '@/types/curriculum'
import { createState, studioReducer, type StudioAction } from '@/state/store'
import { detectPayload, serializeCurriculum, toJson } from '@/lib/schema'
import { sampleCurriculum } from '@/lib/sampleCurriculum'
import { validateCurriculum } from '@/lib/validation'

function run(curriculum: Curriculum, ...actions: StudioAction[]): Curriculum {
  let state = createState(structuredClone(curriculum))
  for (const action of actions) state = studioReducer(state, action)
  return state.curriculum
}

function mcq(curriculum: Curriculum, lessonId: string, activityId: string) {
  const lesson = curriculum.lessons.find((item) => item.id === lessonId)
  return lesson?.activities.find(
    (item) => item.id === activityId,
  ) as MultipleChoiceActivity
}

function unit(curriculum: Curriculum, unitId: string) {
  return curriculum.units.find((item) => item.id === unitId)!
}

describe('lesson references', () => {
  it('reorders lessonIds without touching the lesson objects', () => {
    const next = run(sampleCurriculum, {
      type: 'moveLesson',
      lessonId: 'accessing',
      toUnitId: 'array-foundations',
      toIndex: 1,
    })

    expect(unit(next, 'array-foundations').lessonIds).toEqual([
      'arrays',
      'accessing',
      'indexes',
    ])
    expect(next.lessons.map((lesson) => lesson.id)).toEqual(
      sampleCurriculum.lessons.map((lesson) => lesson.id),
    )
  })

  it('moves a lesson between units', () => {
    const next = run(sampleCurriculum, {
      type: 'moveLesson',
      lessonId: 'indexes',
      toUnitId: 'array-explorer',
      toIndex: 0,
    })

    expect(unit(next, 'array-foundations').lessonIds).toEqual(['arrays', 'accessing'])
    expect(unit(next, 'array-explorer').lessonIds[0]).toBe('indexes')
    expect(next.lessons).toHaveLength(sampleCurriculum.lessons.length)
  })

  it('rewrites every reference when a lesson id is renamed', () => {
    const next = run(sampleCurriculum, {
      type: 'updateLesson',
      lessonId: 'arrays',
      patch: { id: 'array-basics' },
    })

    expect(unit(next, 'array-foundations').lessonIds).toEqual([
      'array-basics',
      'indexes',
      'accessing',
    ])
    expect(next.lessons.some((lesson) => lesson.id === 'array-basics')).toBe(true)
    expect(validateCurriculum(next).errors).toHaveLength(0)
  })

  it('never lets a rename collide with an existing id', () => {
    const next = run(sampleCurriculum, {
      type: 'updateLesson',
      lessonId: 'arrays',
      patch: { id: 'indexes' },
    })

    expect(unit(next, 'array-foundations').lessonIds).toEqual([
      'indexes-2',
      'indexes',
      'accessing',
    ])
    expect(validateCurriculum(next).errors).toHaveLength(0)
  })

  it('drops the id from every unit when a lesson is deleted', () => {
    const next = run(sampleCurriculum, { type: 'deleteLesson', lessonId: 'indexes' })

    expect(unit(next, 'array-foundations').lessonIds).toEqual(['arrays', 'accessing'])
    expect(next.lessons.some((lesson) => lesson.id === 'indexes')).toBe(false)
    expect(validateCurriculum(next).errors).toHaveLength(0)
  })

  it('gives a duplicated lesson a fresh id beside the original', () => {
    const next = run(sampleCurriculum, { type: 'duplicateLesson', lessonId: 'arrays' })

    expect(unit(next, 'array-foundations').lessonIds).toEqual([
      'arrays',
      'arrays-copy',
      'indexes',
      'accessing',
    ])
    expect(validateCurriculum(next).errors).toHaveLength(0)
  })
})

describe('mcq option reordering', () => {
  it('keeps the correct answer attached to its option when B moves to the front', () => {
    const base = run(sampleCurriculum, {
      type: 'updateActivity',
      lessonId: 'arrays',
      activityId: 'arrays-02',
      activity: {
        id: 'arrays-02',
        type: 'multiple_choice',
        title: 'ABC',
        question: 'q',
        options: ['A', 'B', 'C'],
        answer: 1,
      },
    })

    const next = run(base, {
      type: 'reorderOptions',
      lessonId: 'arrays',
      activityId: 'arrays-02',
      from: 1,
      to: 0,
    })

    const activity = mcq(next, 'arrays', 'arrays-02')
    expect(activity.options).toEqual(['B', 'A', 'C'])
    expect(activity.answer).toBe(0)
  })

  it('shifts the answer when another option moves across it', () => {
    // ['A','B','C'] answer=2 ('C'); move A to the end -> ['B','C','A'], answer 1.
    const base = run(sampleCurriculum, {
      type: 'updateActivity',
      lessonId: 'arrays',
      activityId: 'arrays-02',
      activity: {
        id: 'arrays-02',
        type: 'multiple_choice',
        title: 'ABC',
        question: 'q',
        options: ['A', 'B', 'C'],
        answer: 2,
      },
    })

    const next = run(base, {
      type: 'reorderOptions',
      lessonId: 'arrays',
      activityId: 'arrays-02',
      from: 0,
      to: 2,
    })

    const activity = mcq(next, 'arrays', 'arrays-02')
    expect(activity.options).toEqual(['B', 'C', 'A'])
    expect(activity.answer).toBe(1)
  })
})

describe('import', () => {
  it('detects an array of activities and appends them to the target lesson', () => {
    const detection = detectPayload([
      {
        id: 'arrays-04',
        type: 'multiple_choice',
        title: 'Find the Index',
        question: 'What is at index 2?',
        options: ['4', '7', '9', '12'],
        answer: 2,
        explanation: 'Index 2 points to the third element.',
      },
    ])

    expect(detection.ok && detection.payload.kind).toBe('activities')
    if (!detection.ok || detection.payload.kind !== 'activities') return

    const next = run(sampleCurriculum, {
      type: 'importActivities',
      lessonId: 'arrays',
      activities: detection.payload.data,
    })

    const lesson = next.lessons.find((item) => item.id === 'arrays')!
    expect(lesson.activities.at(-1)?.id).toBe('arrays-04')
    expect(lesson.activities).toHaveLength(4)
  })

  it('detects a single lesson and links it into the selected unit', () => {
    const detection = detectPayload({
      id: 'searching',
      title: 'Searching Arrays',
      description: 'Learn how to find values.',
      skill: 'Search',
      estimatedMinutes: 5,
      order: 5,
      icon: '🔎',
      activities: [],
    })

    expect(detection.ok && detection.payload.kind).toBe('lesson')
    if (!detection.ok || detection.payload.kind !== 'lesson') return

    const next = run(sampleCurriculum, {
      type: 'importLessons',
      unitId: 'array-foundations',
      lessons: [detection.payload.data],
    })

    expect(unit(next, 'array-foundations').lessonIds).toContain('searching')
    expect(next.lessons.some((lesson) => lesson.id === 'searching')).toBe(true)
  })

  it('detects a complete curriculum', () => {
    const detection = detectPayload(JSON.parse(toJson(sampleCurriculum)))
    expect(detection.ok && detection.payload.kind).toBe('curriculum')
  })

  it('rejects an activity with an unknown type', () => {
    const detection = detectPayload({ id: 'x', type: 'video', title: 'Nope' })
    expect(detection.ok).toBe(false)
  })
})

describe('serialisation', () => {
  it('round-trips the sample byte-for-byte', () => {
    const once = toJson(sampleCurriculum)
    const reparsed = detectPayload(JSON.parse(once))
    expect(reparsed.ok).toBe(true)
    if (!reparsed.ok || reparsed.payload.kind !== 'curriculum') return
    expect(toJson(reparsed.payload.data)).toBe(once)
  })

  it('exports exactly { chapter, units, lessons } in order', () => {
    expect(Object.keys(serializeCurriculum(sampleCurriculum))).toEqual([
      'chapter',
      'units',
      'lessons',
    ])
  })

  it('omits optional fields instead of writing null', () => {
    const json = toJson(sampleCurriculum)
    expect(json).not.toContain('null')

    const parsed = JSON.parse(json) as {
      units: Record<string, unknown>[]
      lessons: Record<string, unknown>[]
    }
    const plainUnit = parsed.units.find((item) => item.id === 'first-steps')!
    expect('isBoss' in plainUnit).toBe(false)
    expect(Object.keys(plainUnit)).toEqual(['id', 'title', 'iconKey', 'lessonIds'])

    const bossUnit = parsed.units.find((item) => item.id === 'array-guardian')!
    expect(bossUnit.isBoss).toBe(true)

    const welcome = parsed.lessons.find((item) => item.id === 'welcome')!
    const first = (welcome.activities as Record<string, unknown>[])[1]
    expect('hint' in first).toBe(false)
  })

  it('keeps unknown fields a consuming app may have added', () => {
    const withExtras = structuredClone(sampleCurriculum) as Curriculum & {
      lessons: (Curriculum['lessons'][number] & { xp?: number })[]
    }
    withExtras.lessons[0].xp = 50

    const json = JSON.parse(toJson(withExtras)) as {
      lessons: Record<string, unknown>[]
    }
    expect(json.lessons[0].xp).toBe(50)
  })

  it('drops an emptied optional string rather than exporting ""', () => {
    const next = run(sampleCurriculum, {
      type: 'updateActivity',
      lessonId: 'welcome',
      activityId: 'welcome-01',
      activity: {
        id: 'welcome-01',
        type: 'explanation',
        title: 'Think in steps',
        content: 'An algorithm is a clear set of steps.',
        visual: '',
      },
    })

    const activity = JSON.parse(toJson(next)).lessons[0].activities[0]
    expect('visual' in activity).toBe(false)
  })
})

describe('validation', () => {
  it('accepts the sample with only the empty-lesson warning', () => {
    const report = validateCurriculum(sampleCurriculum)
    expect(report.errors).toHaveLength(0)
    expect(report.warnings.map((issue) => issue.message)).toEqual([
      'Lesson has no activities.',
    ])
  })

  it('flags a missing lesson reference', () => {
    const broken = structuredClone(sampleCurriculum)
    broken.units[1].lessonIds.push('array-search')

    const report = validateCurriculum(broken)
    expect(report.valid).toBe(false)
    expect(
      report.errors.some((issue) =>
        issue.message.includes('References missing lesson: array-search'),
      ),
    ).toBe(true)
  })

  it('flags an out-of-range mcq answer and a single-option mcq', () => {
    const broken = structuredClone(sampleCurriculum)
    const activity = broken.lessons[1].activities[1] as MultipleChoiceActivity
    activity.answer = 9
    activity.options = ['only']

    const report = validateCurriculum(broken)
    expect(report.valid).toBe(false)
    expect(
      report.errors.some((issue) => issue.message.includes('invalid answer index')),
    ).toBe(true)
    expect(
      report.errors.some((issue) => issue.message.includes('at least 2 options')),
    ).toBe(true)
  })

  it('warns about a lesson no unit references', () => {
    const orphaned = structuredClone(sampleCurriculum)
    orphaned.units[0].lessonIds = []

    const report = validateCurriculum(orphaned)
    expect(
      report.warnings.some((issue) =>
        issue.message.includes('not referenced by any unit'),
      ),
    ).toBe(true)
  })
})

describe('units', () => {
  it('reorders the units array', () => {
    const next = run(sampleCurriculum, { type: 'reorderUnits', from: 0, to: 2 })
    expect(next.units.map((item) => item.id)).toEqual([
      'array-foundations',
      'array-explorer',
      'first-steps',
      'array-guardian',
      'next-frontier',
    ])
  })

  it('can delete a unit while keeping its lessons', () => {
    const next = run(sampleCurriculum, {
      type: 'deleteUnit',
      unitId: 'first-steps',
      deleteLessons: false,
    })
    expect(next.units.some((item) => item.id === 'first-steps')).toBe(false)
    expect(next.lessons.some((item) => item.id === 'welcome')).toBe(true)
  })

  it('deep-copies lessons when a unit is duplicated so no lesson is shared', () => {
    const next = run(sampleCurriculum, { type: 'duplicateUnit', unitId: 'array-foundations' })
    const copy = next.units.find((item) => item.id === 'array-foundations-copy')!

    expect(copy.lessonIds).toHaveLength(3)
    expect(copy.lessonIds).not.toContain('arrays')
    expect(validateCurriculum(next).errors).toHaveLength(0)
  })
})
