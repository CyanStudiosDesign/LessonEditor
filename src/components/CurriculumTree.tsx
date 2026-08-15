import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Layers,
  Plus,
  Shield,
  Trash2,
  Unlink,
} from 'lucide-react'
import type { Lesson, Selection, Unit } from '@/types/curriculum'
import { cn, pluralize } from '@/lib/utils'
import { unitIcon } from '@/lib/icons'
import { useLessonMap, useStudio } from '@/state/store'
import { IconButton } from '@/components/ui/Button'
import { DeleteUnitDialog } from '@/components/dialogs/DeleteUnitDialog'

type DragData =
  | { kind: 'unit'; unitId: string }
  | { kind: 'lesson'; unitId: string; lessonId: string }
  | { kind: 'dropzone'; unitId: string }

function isSelected(selection: Selection, target: Selection): boolean {
  if (selection.kind === 'unit' && target.kind === 'unit') {
    return selection.unitId === target.unitId
  }
  if (target.kind === 'lesson') {
    return (
      (selection.kind === 'lesson' || selection.kind === 'activity') &&
      selection.lessonId === target.lessonId
    )
  }
  if (selection.kind === 'chapter' && target.kind === 'chapter') return true
  return false
}

/* ------------------------------------------------------------------ *
 * Lesson row
 * ------------------------------------------------------------------ */

function LessonRow({
  lesson,
  lessonId,
  unitId,
}: {
  lesson: Lesson | undefined
  lessonId: string
  unitId: string
}) {
  const { selection, dispatch } = useStudio()
  const data: DragData = { kind: 'lesson', unitId, lessonId }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lesson:${unitId}:${lessonId}`, data })

  const selected = isSelected(selection, { kind: 'lesson', lessonId })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/lesson relative', isDragging && 'z-10 opacity-40')}
    >
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg py-1 pr-1 pl-1 transition',
          selected ? 'bg-accent-soft' : 'hover:bg-panel-2',
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-ink-faint/50 opacity-0 transition group-hover/lesson:opacity-100 active:cursor-grabbing"
          aria-label={`Reorder ${lesson?.title ?? lessonId}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} />
        </button>

        <button
          type="button"
          onClick={() => dispatch({ type: 'select', selection: { kind: 'lesson', lessonId } })}
          className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
        >
          <span className="w-5 shrink-0 text-center text-sm leading-none">
            {lesson?.icon || '•'}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'block truncate text-[13px]',
                selected ? 'font-medium text-ink' : 'text-ink-muted',
                !lesson && 'text-danger italic',
              )}
            >
              {lesson ? lesson.title : `Missing lesson: ${lessonId}`}
            </span>
          </span>
          {lesson?.isBoss ? (
            <Shield size={12} className="shrink-0 text-boss" />
          ) : null}
          {lesson ? (
            <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
              {lesson.activities.length}
            </span>
          ) : null}
        </button>

        <IconButton
          label="Remove from unit"
          className="h-6 w-6 opacity-0 group-hover/lesson:opacity-100"
          onClick={() => dispatch({ type: 'detachLesson', lessonId, unitId })}
        >
          <Unlink size={12} />
        </IconButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Unit block
 * ------------------------------------------------------------------ */

function UnitBlock({
  unit,
  onRequestDelete,
}: {
  unit: Unit
  onRequestDelete: (unit: Unit) => void
}) {
  const { selection, collapsedUnits, dispatch } = useStudio()
  const lessonMap = useLessonMap()
  const collapsed = collapsedUnits.includes(unit.id)
  const data: DragData = { kind: 'unit', unitId: unit.id }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `unit:${unit.id}`, data })

  const dropzone: DragData = { kind: 'dropzone', unitId: unit.id }
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `dropzone:${unit.id}`,
    data: dropzone,
  })

  const Icon = unitIcon(unit.iconKey)
  const selected = isSelected(selection, { kind: 'unit', unitId: unit.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/unit', isDragging && 'opacity-40')}
    >
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg py-1 pr-1 transition',
          selected ? 'bg-accent-soft' : 'hover:bg-panel-2',
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-ink-faint/50 opacity-0 transition group-hover/unit:opacity-100 active:cursor-grabbing"
          aria-label={`Reorder ${unit.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        <IconButton
          label={collapsed ? 'Expand unit' : 'Collapse unit'}
          className="h-6 w-6"
          onClick={() => dispatch({ type: 'toggleUnit', unitId: unit.id })}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </IconButton>

        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'select', selection: { kind: 'unit', unitId: unit.id } })
          }
          className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
        >
          <Icon
            size={14}
            className={cn('shrink-0', unit.isBoss ? 'text-boss' : 'text-accent')}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {unit.title || <span className="text-danger italic">Untitled unit</span>}
          </span>
          {unit.isBoss ? (
            <span className="chip border border-boss/30 bg-boss/10 text-boss">boss</span>
          ) : null}
          <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
            {unit.lessonIds.length}
          </span>
        </button>

        <div className="flex shrink-0 items-center opacity-0 transition group-hover/unit:opacity-100">
          <IconButton
            label="Add lesson"
            className="h-6 w-6"
            onClick={() => {
              dispatch({ type: 'expandUnit', unitId: unit.id })
              dispatch({ type: 'addLesson', unitId: unit.id })
            }}
          >
            <Plus size={13} />
          </IconButton>
          <IconButton
            label="Duplicate unit"
            className="h-6 w-6"
            onClick={() => dispatch({ type: 'duplicateUnit', unitId: unit.id })}
          >
            <Copy size={12} />
          </IconButton>
          <IconButton
            label="Delete unit"
            className="h-6 w-6 hover:text-danger"
            onClick={() => onRequestDelete(unit)}
          >
            <Trash2 size={12} />
          </IconButton>
        </div>
      </div>

      {collapsed ? null : (
        <div
          ref={setDropRef}
          className={cn(
            'mt-0.5 ml-[18px] border-l border-edge pl-2 transition',
            isOver && 'border-accent/60 bg-accent/5',
          )}
        >
          <SortableContext
            items={unit.lessonIds.map((id) => `lesson:${unit.id}:${id}`)}
            strategy={verticalListSortingStrategy}
          >
            {unit.lessonIds.map((lessonId) => (
              <LessonRow
                key={`${unit.id}:${lessonId}`}
                unitId={unit.id}
                lessonId={lessonId}
                lesson={lessonMap.get(lessonId)}
              />
            ))}
          </SortableContext>

          {unit.lessonIds.length === 0 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'addLesson', unitId: unit.id })}
              className="my-1 w-full rounded-lg border border-dashed border-edge px-2 py-1.5 text-left text-xs text-ink-faint hover:border-accent/40 hover:text-ink-muted"
            >
              No lessons — add one
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Tree
 * ------------------------------------------------------------------ */

export function CurriculumTree() {
  const { curriculum, selection, dispatch } = useStudio()
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [unitPendingDelete, setUnitPendingDelete] = useState<Unit | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const orphans = useMemo(() => {
    const referenced = new Set(curriculum.units.flatMap((unit) => unit.lessonIds))
    return curriculum.lessons.filter((lesson) => !referenced.has(lesson.id))
  }, [curriculum])

  const lessonCount = curriculum.lessons.length

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag((event.active.data.current as DragData | undefined) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DragData | undefined
    if (!activeData || !overData) return

    if (activeData.kind === 'unit') {
      const from = curriculum.units.findIndex((unit) => unit.id === activeData.unitId)
      const to = curriculum.units.findIndex((unit) => unit.id === overData.unitId)
      if (from >= 0 && to >= 0 && from !== to) {
        dispatch({ type: 'reorderUnits', from, to })
      }
      return
    }

    if (activeData.kind === 'lesson') {
      const toUnitId = overData.unitId
      const targetUnit = curriculum.units.find((unit) => unit.id === toUnitId)
      if (!targetUnit) return

      let toIndex = targetUnit.lessonIds.length
      if (overData.kind === 'lesson') {
        const at = targetUnit.lessonIds.indexOf(overData.lessonId)
        if (at >= 0) toIndex = at
      }

      const sameSpot =
        activeData.unitId === toUnitId &&
        targetUnit.lessonIds.indexOf(activeData.lessonId) === toIndex
      if (sameSpot) return

      dispatch({
        type: 'moveLesson',
        lessonId: activeData.lessonId,
        toUnitId,
        toIndex,
      })
    }
  }

  const dragLabel = (() => {
    if (!activeDrag) return null
    if (activeDrag.kind === 'unit') {
      return curriculum.units.find((unit) => unit.id === activeDrag.unitId)?.title
    }
    if (activeDrag.kind === 'lesson') {
      return curriculum.lessons.find((lesson) => lesson.id === activeDrag.lessonId)?.title
    }
    return null
  })()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
          Curriculum Tree
        </h2>
        <span className="text-[11px] text-ink-faint">
          {curriculum.units.length}u · {lessonCount}l
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        <button
          type="button"
          onClick={() => dispatch({ type: 'select', selection: { kind: 'chapter' } })}
          className={cn(
            'mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition',
            selection.kind === 'chapter' ? 'bg-accent-soft' : 'hover:bg-panel-2',
          )}
        >
          <Layers size={15} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {curriculum.chapter.title || 'Untitled chapter'}
            </span>
            <span className="block truncate text-[11px] text-ink-faint">
              Chapter {curriculum.chapter.number} · {curriculum.chapter.id}
            </span>
          </span>
        </button>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <SortableContext
            items={curriculum.units.map((unit) => `unit:${unit.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {curriculum.units.map((unit) => (
                <UnitBlock
                  key={unit.id}
                  unit={unit}
                  onRequestDelete={setUnitPendingDelete}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {dragLabel ? (
              <div className="rounded-lg border border-accent/50 bg-panel-2 px-3 py-1.5 text-[13px] text-ink shadow-xl shadow-black/40">
                {dragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          type="button"
          onClick={() => dispatch({ type: 'addUnit' })}
          className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-edge px-3 py-2 text-[13px] text-ink-faint transition hover:border-accent/50 hover:text-ink"
        >
          <Plus size={14} /> Add unit
        </button>

        {orphans.length > 0 ? (
          <div className="mt-5">
            <h3 className="px-2 pb-1 text-[11px] font-semibold tracking-[0.1em] text-boss/80 uppercase">
              Unassigned lessons
            </h3>
            <p className="px-2 pb-1.5 text-[11px] text-ink-faint">
              {pluralize(orphans.length, 'lesson')} not referenced by any unit.
            </p>
            <div className="space-y-0.5">
              {orphans.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'select',
                      selection: { kind: 'lesson', lessonId: lesson.id },
                    })
                  }
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
                    isSelected(selection, { kind: 'lesson', lessonId: lesson.id })
                      ? 'bg-accent-soft'
                      : 'hover:bg-panel-2',
                  )}
                >
                  <span className="w-5 text-center text-sm">{lesson.icon || '•'}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-muted">
                    {lesson.title}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    {lesson.activities.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <DeleteUnitDialog
        unit={unitPendingDelete}
        onClose={() => setUnitPendingDelete(null)}
      />
    </div>
  )
}
