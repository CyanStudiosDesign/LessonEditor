import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  Activity,
  ActivityType,
  Chapter,
  Curriculum,
  Lesson,
  Selection,
  Unit,
} from '@/types/curriculum'
import { arrayMove, uniqueId } from '@/lib/utils'
import {
  allActivityIds,
  allLessonIds,
  allUnitIds,
  cloneLesson,
  cloneUnit,
  makeActivity,
  makeLesson,
  makeUnit,
  nextActivityId,
} from '@/lib/factories'
import { sampleCurriculum } from '@/lib/sampleCurriculum'
import { loadPersisted, persist } from '@/lib/storage'

export interface StudioState {
  curriculum: Curriculum
  selection: Selection
  collapsedUnits: string[]
  past: Curriculum[]
  future: Curriculum[]
  /** Bumped whenever the curriculum changes, so persistence can debounce. */
  revision: number
  saved: boolean
}

export type StudioAction =
  | { type: 'select'; selection: Selection }
  | { type: 'toggleUnit'; unitId: string }
  | { type: 'expandUnit'; unitId: string }
  | { type: 'markSaved'; revision: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'replaceCurriculum'; curriculum: Curriculum; selection?: Selection }
  | { type: 'updateChapter'; patch: Partial<Chapter> }
  | { type: 'addUnit' }
  | { type: 'updateUnit'; unitId: string; patch: Partial<Omit<Unit, 'lessonIds'>> }
  | { type: 'duplicateUnit'; unitId: string }
  | { type: 'deleteUnit'; unitId: string; deleteLessons: boolean }
  | { type: 'reorderUnits'; from: number; to: number }
  | { type: 'addLesson'; unitId: string }
  | { type: 'updateLesson'; lessonId: string; patch: Partial<Omit<Lesson, 'activities'>> }
  | { type: 'duplicateLesson'; lessonId: string }
  | { type: 'deleteLesson'; lessonId: string }
  | { type: 'moveLesson'; lessonId: string; toUnitId: string; toIndex: number }
  | { type: 'detachLesson'; lessonId: string; unitId: string }
  | { type: 'attachLesson'; lessonId: string; unitId: string }
  | { type: 'renumberLessonOrder' }
  | { type: 'addActivity'; lessonId: string; activityType: ActivityType }
  | { type: 'updateActivity'; lessonId: string; activityId: string; activity: Activity }
  | { type: 'duplicateActivity'; lessonId: string; activityId: string }
  | { type: 'deleteActivity'; lessonId: string; activityId: string }
  | { type: 'reorderActivities'; lessonId: string; from: number; to: number }
  | { type: 'reorderOptions'; lessonId: string; activityId: string; from: number; to: number }
  | { type: 'importActivities'; lessonId: string; activities: Activity[] }
  | { type: 'importLessons'; unitId: string | null; lessons: Lesson[] }

const HISTORY_LIMIT = 60

/** Actions that do not touch the curriculum and so never create history. */
const NON_MUTATING: StudioAction['type'][] = [
  'select',
  'toggleUnit',
  'expandUnit',
  'markSaved',
  'undo',
  'redo',
]

function unitOwning(curriculum: Curriculum, lessonId: string): Unit | undefined {
  return curriculum.units.find((unit) => unit.lessonIds.includes(lessonId))
}

/* ------------------------------------------------------------------ *
 * Pure curriculum transforms
 * ------------------------------------------------------------------ */

function mapUnit(
  curriculum: Curriculum,
  unitId: string,
  fn: (unit: Unit) => Unit,
): Curriculum {
  return {
    ...curriculum,
    units: curriculum.units.map((unit) => (unit.id === unitId ? fn(unit) : unit)),
  }
}

function mapLesson(
  curriculum: Curriculum,
  lessonId: string,
  fn: (lesson: Lesson) => Lesson,
): Curriculum {
  return {
    ...curriculum,
    lessons: curriculum.lessons.map((lesson) =>
      lesson.id === lessonId ? fn(lesson) : lesson,
    ),
  }
}

/** Renaming a lesson id rewrites every `lessonIds` reference in lock-step. */
function renameLessonId(
  curriculum: Curriculum,
  fromId: string,
  toId: string,
): Curriculum {
  return {
    ...curriculum,
    units: curriculum.units.map((unit) =>
      unit.lessonIds.includes(fromId)
        ? {
            ...unit,
            lessonIds: unit.lessonIds.map((id) => (id === fromId ? toId : id)),
          }
        : unit,
    ),
    lessons: curriculum.lessons.map((lesson) =>
      lesson.id === fromId ? { ...lesson, id: toId } : lesson,
    ),
  }
}

function removeLessonReferences(curriculum: Curriculum, lessonId: string): Unit[] {
  return curriculum.units.map((unit) =>
    unit.lessonIds.includes(lessonId)
      ? { ...unit, lessonIds: unit.lessonIds.filter((id) => id !== lessonId) }
      : unit,
  )
}

function reduceCurriculum(
  state: StudioState,
  action: StudioAction,
): { curriculum: Curriculum; selection?: Selection } | null {
  const c = state.curriculum

  switch (action.type) {
    case 'replaceCurriculum':
      return { curriculum: action.curriculum, selection: action.selection }

    case 'updateChapter':
      return { curriculum: { ...c, chapter: { ...c.chapter, ...action.patch } } }

    case 'addUnit': {
      const unit = makeUnit(c)
      return {
        curriculum: { ...c, units: [...c.units, unit] },
        selection: { kind: 'unit', unitId: unit.id },
      }
    }

    case 'updateUnit': {
      const patch = { ...action.patch }
      let next = c
      if (patch.id !== undefined && patch.id !== action.unitId) {
        const target = uniqueId(
          patch.id,
          allUnitIds(c).filter((id) => id !== action.unitId),
        )
        patch.id = target
      }
      next = mapUnit(next, action.unitId, (unit) => {
        const merged: Unit = { ...unit, ...patch }
        if (merged.isBoss !== true) delete merged.isBoss
        return merged
      })
      const newId = patch.id ?? action.unitId
      return { curriculum: next, selection: { kind: 'unit', unitId: newId } }
    }

    case 'duplicateUnit': {
      const index = c.units.findIndex((unit) => unit.id === action.unitId)
      if (index < 0) return null
      const source = c.units[index]
      let working = c
      const copiedIds: string[] = []
      for (const lessonId of source.lessonIds) {
        const lesson = working.lessons.find((item) => item.id === lessonId)
        if (!lesson) continue
        const copy = cloneLesson(lesson, working)
        working = { ...working, lessons: [...working.lessons, copy] }
        copiedIds.push(copy.id)
      }
      const copy = { ...cloneUnit(source, working), lessonIds: copiedIds }
      const units = working.units.slice()
      units.splice(index + 1, 0, copy)
      return {
        curriculum: { ...working, units },
        selection: { kind: 'unit', unitId: copy.id },
      }
    }

    case 'deleteUnit': {
      const unit = c.units.find((item) => item.id === action.unitId)
      if (!unit) return null
      const units = c.units.filter((item) => item.id !== action.unitId)
      const lessons = action.deleteLessons
        ? c.lessons.filter((lesson) => !unit.lessonIds.includes(lesson.id))
        : c.lessons
      return {
        curriculum: { ...c, units, lessons },
        selection: { kind: 'chapter' },
      }
    }

    case 'reorderUnits':
      return { curriculum: { ...c, units: arrayMove(c.units, action.from, action.to) } }

    case 'addLesson': {
      const lesson = makeLesson(c)
      const withLesson: Curriculum = { ...c, lessons: [...c.lessons, lesson] }
      const next = mapUnit(withLesson, action.unitId, (unit) => ({
        ...unit,
        lessonIds: [...unit.lessonIds, lesson.id],
      }))
      return { curriculum: next, selection: { kind: 'lesson', lessonId: lesson.id } }
    }

    case 'updateLesson': {
      const patch = { ...action.patch }
      let next = c
      let finalId = action.lessonId

      if (patch.id !== undefined && patch.id !== action.lessonId) {
        finalId = uniqueId(
          patch.id,
          allLessonIds(c).filter((id) => id !== action.lessonId),
        )
        next = renameLessonId(next, action.lessonId, finalId)
      }
      delete patch.id

      next = mapLesson(next, finalId, (lesson) => {
        const merged: Lesson = { ...lesson, ...patch }
        if (merged.isBoss !== true) delete merged.isBoss
        return merged
      })
      return { curriculum: next, selection: { kind: 'lesson', lessonId: finalId } }
    }

    case 'duplicateLesson': {
      const lesson = c.lessons.find((item) => item.id === action.lessonId)
      if (!lesson) return null
      const copy = cloneLesson(lesson, c)
      const owner = unitOwning(c, action.lessonId)
      let next: Curriculum = { ...c, lessons: [...c.lessons, copy] }
      if (owner) {
        next = mapUnit(next, owner.id, (unit) => {
          const at = unit.lessonIds.indexOf(action.lessonId)
          const lessonIds = unit.lessonIds.slice()
          lessonIds.splice(at + 1, 0, copy.id)
          return { ...unit, lessonIds }
        })
      }
      return { curriculum: next, selection: { kind: 'lesson', lessonId: copy.id } }
    }

    case 'deleteLesson': {
      const next: Curriculum = {
        ...c,
        units: removeLessonReferences(c, action.lessonId),
        lessons: c.lessons.filter((lesson) => lesson.id !== action.lessonId),
      }
      return { curriculum: next, selection: { kind: 'chapter' } }
    }

    case 'moveLesson': {
      const from = unitOwning(c, action.lessonId)
      const units = c.units.map((unit) => {
        if (unit.id === from?.id && unit.id !== action.toUnitId) {
          return {
            ...unit,
            lessonIds: unit.lessonIds.filter((id) => id !== action.lessonId),
          }
        }
        return unit
      })
      const nextUnits = units.map((unit) => {
        if (unit.id !== action.toUnitId) return unit
        const without = unit.lessonIds.filter((id) => id !== action.lessonId)
        const index = Math.max(0, Math.min(action.toIndex, without.length))
        const lessonIds = without.slice()
        lessonIds.splice(index, 0, action.lessonId)
        return { ...unit, lessonIds }
      })
      return { curriculum: { ...c, units: nextUnits } }
    }

    case 'detachLesson':
      return {
        curriculum: mapUnit(c, action.unitId, (unit) => ({
          ...unit,
          lessonIds: unit.lessonIds.filter((id) => id !== action.lessonId),
        })),
      }

    case 'attachLesson':
      return {
        curriculum: mapUnit(c, action.unitId, (unit) =>
          unit.lessonIds.includes(action.lessonId)
            ? unit
            : { ...unit, lessonIds: [...unit.lessonIds, action.lessonId] },
        ),
      }

    case 'renumberLessonOrder': {
      const sequence: string[] = []
      for (const unit of c.units) {
        for (const lessonId of unit.lessonIds) {
          if (!sequence.includes(lessonId)) sequence.push(lessonId)
        }
      }
      for (const lesson of c.lessons) {
        if (!sequence.includes(lesson.id)) sequence.push(lesson.id)
      }
      return {
        curriculum: {
          ...c,
          lessons: c.lessons.map((lesson) => ({
            ...lesson,
            order: sequence.indexOf(lesson.id) + 1,
          })),
        },
      }
    }

    case 'addActivity': {
      const activity = makeActivity(
        action.activityType,
        action.lessonId,
        allActivityIds(c),
      )
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: [...lesson.activities, activity],
        })),
        selection: {
          kind: 'activity',
          lessonId: action.lessonId,
          activityId: activity.id,
        },
      }
    }

    case 'updateActivity': {
      const taken = allActivityIds(c).filter((id) => id !== action.activityId)
      const nextId =
        action.activity.id === action.activityId
          ? action.activityId
          : uniqueId(action.activity.id || action.activityId, taken)
      const activity = { ...action.activity, id: nextId } as Activity
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: lesson.activities.map((item) =>
            item.id === action.activityId ? activity : item,
          ),
        })),
        selection: {
          kind: 'activity',
          lessonId: action.lessonId,
          activityId: nextId,
        },
      }
    }

    case 'duplicateActivity': {
      const lesson = c.lessons.find((item) => item.id === action.lessonId)
      const source = lesson?.activities.find((item) => item.id === action.activityId)
      if (!lesson || !source) return null
      const copy = {
        ...source,
        id: nextActivityId(lesson.id, allActivityIds(c)),
      } as Activity
      const at = lesson.activities.findIndex((item) => item.id === action.activityId)
      const activities = lesson.activities.slice()
      activities.splice(at + 1, 0, copy)
      return {
        curriculum: mapLesson(c, action.lessonId, (item) => ({ ...item, activities })),
        selection: {
          kind: 'activity',
          lessonId: action.lessonId,
          activityId: copy.id,
        },
      }
    }

    case 'deleteActivity':
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: lesson.activities.filter((item) => item.id !== action.activityId),
        })),
        selection: { kind: 'lesson', lessonId: action.lessonId },
      }

    case 'reorderActivities':
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: arrayMove(lesson.activities, action.from, action.to),
        })),
      }

    /**
     * Reordering MCQ options must carry the correct answer with its option —
     * the answer is an index, so it is remapped, never left pointing at the
     * option that happened to land in that slot.
     */
    case 'reorderOptions':
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: lesson.activities.map((item) => {
            if (item.id !== action.activityId || item.type !== 'multiple_choice') {
              return item
            }
            const options = arrayMove(item.options, action.from, action.to)
            let answer = item.answer
            if (answer === action.from) {
              answer = action.to
            } else if (action.from < answer && answer <= action.to) {
              answer -= 1
            } else if (action.to <= answer && answer < action.from) {
              answer += 1
            }
            return { ...item, options, answer }
          }),
        })),
      }

    case 'importActivities': {
      const taken = new Set(allActivityIds(c))
      const incoming = action.activities.map((activity) => {
        const id = taken.has(activity.id)
          ? nextActivityId(action.lessonId, taken)
          : activity.id
        taken.add(id)
        return { ...activity, id } as Activity
      })
      return {
        curriculum: mapLesson(c, action.lessonId, (lesson) => ({
          ...lesson,
          activities: [...lesson.activities, ...incoming],
        })),
        selection: { kind: 'lesson', lessonId: action.lessonId },
      }
    }

    case 'importLessons': {
      const takenLessons = new Set(allLessonIds(c))
      const takenActivities = new Set(allActivityIds(c))
      const added: Lesson[] = []

      for (const lesson of action.lessons) {
        const id = uniqueId(lesson.id, takenLessons)
        takenLessons.add(id)
        const activities = lesson.activities.map((activity) => {
          const activityId = takenActivities.has(activity.id)
            ? nextActivityId(id, takenActivities)
            : activity.id
          takenActivities.add(activityId)
          return { ...activity, id: activityId } as Activity
        })
        added.push({ ...lesson, id, activities })
      }

      let next: Curriculum = { ...c, lessons: [...c.lessons, ...added] }
      if (action.unitId) {
        next = mapUnit(next, action.unitId, (unit) => ({
          ...unit,
          lessonIds: [...unit.lessonIds, ...added.map((lesson) => lesson.id)],
        }))
      }
      const first = added[0]
      return {
        curriculum: next,
        selection: first ? { kind: 'lesson', lessonId: first.id } : undefined,
      }
    }

    default:
      return null
  }
}

/** Exported for tests — the reducer is the whole editing model. */
export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'select':
      return { ...state, selection: action.selection }

    case 'toggleUnit': {
      const collapsed = state.collapsedUnits.includes(action.unitId)
        ? state.collapsedUnits.filter((id) => id !== action.unitId)
        : [...state.collapsedUnits, action.unitId]
      return { ...state, collapsedUnits: collapsed }
    }

    case 'expandUnit':
      return {
        ...state,
        collapsedUnits: state.collapsedUnits.filter((id) => id !== action.unitId),
      }

    case 'markSaved':
      return state.revision === action.revision ? { ...state, saved: true } : state

    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        ...state,
        curriculum: previous,
        past: state.past.slice(0, -1),
        future: [state.curriculum, ...state.future].slice(0, HISTORY_LIMIT),
        revision: state.revision + 1,
        saved: false,
      }
    }

    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        curriculum: next,
        past: [...state.past, state.curriculum].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        revision: state.revision + 1,
        saved: false,
      }
    }

    default: {
      if (NON_MUTATING.includes(action.type)) return state
      const result = reduceCurriculum(state, action)
      if (!result || result.curriculum === state.curriculum) return state
      return {
        ...state,
        curriculum: result.curriculum,
        selection: result.selection ?? state.selection,
        past: [...state.past, state.curriculum].slice(-HISTORY_LIMIT),
        future: [],
        revision: state.revision + 1,
        saved: false,
      }
    }
  }
}

export function createState(curriculum: Curriculum): StudioState {
  return {
    curriculum,
    selection: { kind: 'chapter' },
    collapsedUnits: [],
    past: [],
    future: [],
    revision: 0,
    saved: true,
  }
}

function initState(): StudioState {
  const restored = loadPersisted()
  return {
    curriculum: restored?.curriculum ?? sampleCurriculum,
    selection: restored?.selection ?? { kind: 'chapter' },
    collapsedUnits: restored?.collapsedUnits ?? [],
    past: [],
    future: [],
    revision: 0,
    saved: true,
  }
}

interface StudioContextValue extends StudioState {
  dispatch: (action: StudioAction) => void
  canUndo: boolean
  canRedo: boolean
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studioReducer, undefined, initState)
  const timer = useRef<number | undefined>(undefined)

  /* Debounced local persistence. */
  useEffect(() => {
    if (state.saved) return
    window.clearTimeout(timer.current)
    const revision = state.revision
    timer.current = window.setTimeout(() => {
      persist({
        curriculum: state.curriculum,
        selection: state.selection,
        collapsedUnits: state.collapsedUnits,
      })
      dispatch({ type: 'markSaved', revision })
    }, 500)
    return () => window.clearTimeout(timer.current)
  }, [state.curriculum, state.selection, state.collapsedUnits, state.revision, state.saved])

  const value = useMemo<StudioContextValue>(
    () => ({
      ...state,
      dispatch,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state],
  )

  return <StudioContext value={value}>{children}</StudioContext>
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext)
  if (!context) throw new Error('useStudio must be used inside <StudioProvider>')
  return context
}

/* ---- selectors ---- */

export function useSelectedLesson(): Lesson | undefined {
  const { curriculum, selection } = useStudio()
  const lessonId =
    selection.kind === 'lesson' || selection.kind === 'activity'
      ? selection.lessonId
      : undefined
  return useMemo(
    () => curriculum.lessons.find((lesson) => lesson.id === lessonId),
    [curriculum.lessons, lessonId],
  )
}

export function useLessonMap(): Map<string, Lesson> {
  const { curriculum } = useStudio()
  return useMemo(
    () => new Map(curriculum.lessons.map((lesson) => [lesson.id, lesson])),
    [curriculum.lessons],
  )
}

/** Stable dispatch helpers used across the editors. */
export function useStudioActions() {
  const { dispatch } = useStudio()
  return useMemo(
    () => ({
      select: (selection: Selection) => dispatch({ type: 'select', selection }),
      dispatch,
    }),
    [dispatch],
  )
}

export function useSelect() {
  const { dispatch } = useStudio()
  return useCallback(
    (selection: Selection) => dispatch({ type: 'select', selection }),
    [dispatch],
  )
}
