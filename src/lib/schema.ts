import { z } from 'zod'
import type {
  Activity,
  Chapter,
  Curriculum,
  Lesson,
  Unit,
} from '@/types/curriculum'

/**
 * Zod mirrors of the canonical JSON. Objects are *loose* on purpose: any extra
 * keys a consuming application may add are preserved through import → edit →
 * export instead of being silently dropped.
 */

/** Accepts a number, or a numeric string (hand-written JSON is forgiving). */
const looseNumber = z.preprocess((v) => {
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return Number(v)
  }
  return v
}, z.number())

const looseInt = z.preprocess((v) => {
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
    return Number(v)
  }
  return v
}, z.number().int('Answer must be a whole number'))

const looseBoolean = z.preprocess((v) => {
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}, z.boolean())

export const chapterSchema = z.looseObject({
  id: z.string().min(1, 'Chapter id is required'),
  title: z.string().min(1, 'Chapter title is required'),
  description: z.string(),
  number: looseNumber,
})

export const unitSchema = z.looseObject({
  id: z.string().min(1, 'Unit id is required'),
  title: z.string().min(1, 'Unit title is required'),
  iconKey: z.string(),
  lessonIds: z.array(z.string()),
  isBoss: looseBoolean.optional(),
})

export const explanationActivitySchema = z.looseObject({
  id: z.string().min(1),
  type: z.literal('explanation'),
  title: z.string(),
  content: z.string(),
  visual: z.string().optional(),
})

export const multipleChoiceActivitySchema = z.looseObject({
  id: z.string().min(1),
  type: z.literal('multiple_choice'),
  title: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  answer: looseInt,
  explanation: z.string().optional(),
  hint: z.string().optional(),
})

export const trueFalseActivitySchema = z.looseObject({
  id: z.string().min(1),
  type: z.literal('true_false'),
  title: z.string(),
  statement: z.string(),
  answer: looseBoolean,
  explanation: z.string().optional(),
  hint: z.string().optional(),
})

export const fillBlankActivitySchema = z.looseObject({
  id: z.string().min(1),
  type: z.literal('fill_blank'),
  title: z.string(),
  prompt: z.string(),
  answer: z.string(),
  acceptableAnswers: z.array(z.string()).optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
})

export const activitySchema = z.discriminatedUnion('type', [
  explanationActivitySchema,
  multipleChoiceActivitySchema,
  trueFalseActivitySchema,
  fillBlankActivitySchema,
])

export const lessonSchema = z.looseObject({
  id: z.string().min(1, 'Lesson id is required'),
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string(),
  skill: z.string(),
  estimatedMinutes: looseNumber,
  order: looseNumber,
  icon: z.string(),
  isBoss: looseBoolean.optional(),
  activities: z.array(activitySchema),
})

export const curriculumSchema = z.looseObject({
  chapter: chapterSchema,
  units: z.array(unitSchema),
  lessons: z.array(lessonSchema),
})

/* ------------------------------------------------------------------ *
 * Serialisation — canonical key order, optional keys omitted entirely
 * ------------------------------------------------------------------ */

type Rec = Record<string, unknown>

/** Copy over any keys the schema does not know about, so nothing is lost. */
function withExtras(source: unknown, known: string[], out: Rec): Rec {
  if (!source || typeof source !== 'object') return out
  for (const [key, value] of Object.entries(source as Rec)) {
    if (!known.includes(key)) out[key] = value
  }
  return out
}

function putOptionalString(out: Rec, key: string, value: string | undefined) {
  if (typeof value === 'string' && value.length > 0) out[key] = value
}

const CHAPTER_KEYS = ['id', 'title', 'description', 'number']
const UNIT_KEYS = ['id', 'title', 'iconKey', 'lessonIds', 'isBoss']
const LESSON_KEYS = [
  'id',
  'title',
  'description',
  'skill',
  'estimatedMinutes',
  'order',
  'icon',
  'isBoss',
  'activities',
]

const ACTIVITY_KEYS: Record<Activity['type'], string[]> = {
  explanation: ['id', 'type', 'title', 'content', 'visual'],
  multiple_choice: [
    'id',
    'type',
    'title',
    'question',
    'options',
    'answer',
    'explanation',
    'hint',
  ],
  true_false: [
    'id',
    'type',
    'title',
    'statement',
    'answer',
    'explanation',
    'hint',
  ],
  fill_blank: [
    'id',
    'type',
    'title',
    'prompt',
    'answer',
    'acceptableAnswers',
    'hint',
    'explanation',
  ],
}

export function serializeChapter(chapter: Chapter): Rec {
  const out: Rec = {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    number: chapter.number,
  }
  return withExtras(chapter, CHAPTER_KEYS, out)
}

export function serializeUnit(unit: Unit): Rec {
  const out: Rec = {
    id: unit.id,
    title: unit.title,
    iconKey: unit.iconKey,
    lessonIds: [...unit.lessonIds],
  }
  if (unit.isBoss === true) out.isBoss = true
  return withExtras(unit, UNIT_KEYS, out)
}

export function serializeActivity(activity: Activity): Rec {
  const out: Rec = { id: activity.id, type: activity.type, title: activity.title }

  switch (activity.type) {
    case 'explanation': {
      out.content = activity.content
      putOptionalString(out, 'visual', activity.visual)
      break
    }
    case 'multiple_choice': {
      out.question = activity.question
      out.options = [...activity.options]
      out.answer = activity.answer
      putOptionalString(out, 'explanation', activity.explanation)
      putOptionalString(out, 'hint', activity.hint)
      break
    }
    case 'true_false': {
      out.statement = activity.statement
      out.answer = activity.answer
      putOptionalString(out, 'explanation', activity.explanation)
      putOptionalString(out, 'hint', activity.hint)
      break
    }
    case 'fill_blank': {
      out.prompt = activity.prompt
      out.answer = activity.answer
      if (activity.acceptableAnswers && activity.acceptableAnswers.length > 0) {
        out.acceptableAnswers = [...activity.acceptableAnswers]
      }
      putOptionalString(out, 'hint', activity.hint)
      putOptionalString(out, 'explanation', activity.explanation)
      break
    }
  }

  return withExtras(activity, ACTIVITY_KEYS[activity.type], out)
}

export function serializeLesson(lesson: Lesson): Rec {
  const out: Rec = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    skill: lesson.skill,
    estimatedMinutes: lesson.estimatedMinutes,
    order: lesson.order,
    icon: lesson.icon,
  }
  if (lesson.isBoss === true) out.isBoss = true
  out.activities = lesson.activities.map(serializeActivity)
  return withExtras(lesson, LESSON_KEYS, out)
}

/** The exact top-level shape written to disk: { chapter, units, lessons }. */
export function serializeCurriculum(curriculum: Curriculum): Rec {
  const out: Rec = {
    chapter: serializeChapter(curriculum.chapter),
    units: curriculum.units.map(serializeUnit),
    lessons: curriculum.lessons.map(serializeLesson),
  }
  return withExtras(curriculum, ['chapter', 'units', 'lessons'], out)
}

export function toJson(curriculum: Curriculum): string {
  return `${JSON.stringify(serializeCurriculum(curriculum), null, 2)}\n`
}

/* ------------------------------------------------------------------ *
 * Paste detection
 * ------------------------------------------------------------------ */

export type DetectedPayload =
  | { kind: 'curriculum'; data: Curriculum }
  | { kind: 'lesson'; data: Lesson }
  | { kind: 'lessons'; data: Lesson[] }
  | { kind: 'activity'; data: Activity }
  | { kind: 'activities'; data: Activity[] }

export type DetectionResult =
  | { ok: true; payload: DetectedPayload }
  | { ok: false; message: string; issues: string[] }

function formatIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 12).map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Figures out what the user pasted — a whole curriculum, a lesson, a list of
 * lessons, an activity or a list of activities — and validates it.
 */
export function detectPayload(raw: unknown): DetectionResult {
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return { ok: false, message: 'The pasted array is empty.', issues: [] }
    }
    const first = raw[0]
    if (isRecord(first) && 'activities' in first) {
      const parsed = z.array(lessonSchema).safeParse(raw)
      if (parsed.success) {
        return { ok: true, payload: { kind: 'lessons', data: parsed.data as Lesson[] } }
      }
      return {
        ok: false,
        message: 'This looks like a list of lessons, but it is not valid.',
        issues: formatIssues(parsed.error),
      }
    }
    const parsed = z.array(activitySchema).safeParse(raw)
    if (parsed.success) {
      return { ok: true, payload: { kind: 'activities', data: parsed.data as Activity[] } }
    }
    const asLessons = z.array(lessonSchema).safeParse(raw)
    if (asLessons.success) {
      return { ok: true, payload: { kind: 'lessons', data: asLessons.data as Lesson[] } }
    }
    return {
      ok: false,
      message: 'This looks like a list of activities, but it is not valid.',
      issues: formatIssues(parsed.error),
    }
  }

  if (!isRecord(raw)) {
    return {
      ok: false,
      message: 'Expected a JSON object or array.',
      issues: [],
    }
  }

  if ('chapter' in raw || ('units' in raw && 'lessons' in raw)) {
    const parsed = curriculumSchema.safeParse(raw)
    if (parsed.success) {
      return { ok: true, payload: { kind: 'curriculum', data: parsed.data as Curriculum } }
    }
    return {
      ok: false,
      message: 'This looks like a complete curriculum, but it is not valid.',
      issues: formatIssues(parsed.error),
    }
  }

  if ('activities' in raw || ('estimatedMinutes' in raw && 'title' in raw)) {
    const parsed = lessonSchema.safeParse(raw)
    if (parsed.success) {
      return { ok: true, payload: { kind: 'lesson', data: parsed.data as Lesson } }
    }
    return {
      ok: false,
      message: 'This looks like a lesson, but it is not valid.',
      issues: formatIssues(parsed.error),
    }
  }

  if ('type' in raw) {
    const parsed = activitySchema.safeParse(raw)
    if (parsed.success) {
      return { ok: true, payload: { kind: 'activity', data: parsed.data as Activity } }
    }
    return {
      ok: false,
      message: 'This looks like an activity, but it is not valid.',
      issues: formatIssues(parsed.error),
    }
  }

  return {
    ok: false,
    message:
      'Could not recognise this JSON. Expected an activity, a list of activities, a lesson, a list of lessons, or a complete curriculum.',
    issues: [],
  }
}

export function parseCurriculum(raw: unknown):
  | { ok: true; data: Curriculum }
  | { ok: false; issues: string[] } {
  const parsed = curriculumSchema.safeParse(raw)
  if (parsed.success) return { ok: true, data: parsed.data as Curriculum }
  return { ok: false, issues: formatIssues(parsed.error) }
}
