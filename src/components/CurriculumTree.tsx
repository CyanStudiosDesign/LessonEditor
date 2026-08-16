import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
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
import { Copy, GripVertical, Plus, Trash2, Unlink } from 'lucide-react'
import type { Lesson, Selection, Unit } from '@/types/curriculum'
import { cn, pluralize } from '@/lib/utils'
import { BOSS_ICON, CHAPTER_ICON, LESSON_ICON, unitIcon } from '@/lib/icons'
import { useLessonMap, useStudio } from '@/state/store'
import TreeView, { TreeFolder, TreeItem } from '@/components/ui/tree-view/TreeView'
import { IconButton } from '@/components/ui/Button'
import { InlineRename } from '@/components/InlineRename'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'
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

/** Shared grip: quiet at rest, legible on hover, solid while dragging. */
function DragHandle({
  label,
  dragging,
  attributes,
  listeners,
}: {
  label: string
  dragging: boolean
  attributes: ReturnType<typeof useSortable>['attributes']
  listeners: ReturnType<typeof useSortable>['listeners']
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Drag to reorder"
      className={cn(
        'shrink-0 cursor-grab touch-none rounded p-0.5 text-edge-strong transition-colors duration-150',
        'group-hover/row:text-ink-faint hover:!text-ink active:cursor-grabbing',
        dragging && 'text-ink',
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={13} />
    </button>
  )
}

function Count({ value }: { value: number }) {
  return (
    <span className="shrink-0 text-[11px] tabular-nums text-ink-faint group-hover/row:hidden">
      {value}
    </span>
  )
}

/**
 * The lesson's authored emoji is the most useful glyph here — it is real
 * curriculum content and tells rows apart. FileText is the structural
 * fallback, and a boss lesson always wins.
 */
function LessonGlyph({
  lesson,
  selected,
}: {
  lesson: Lesson | undefined
  selected: boolean
}) {
  if (lesson?.isBoss) return <BOSS_ICON size={13} className="shrink-0 text-boss" />
  if (lesson?.icon) {
    return (
      <span className="w-[13px] shrink-0 text-center text-[12px] leading-none">
        {lesson.icon}
      </span>
    )
  }
  return (
    <LESSON_ICON
      size={13}
      className={cn('shrink-0', selected ? 'text-accent' : 'text-ink-faint')}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Lesson row
 * ------------------------------------------------------------------ */

function LessonRow({
  lesson,
  lessonId,
  unitId,
  onRequestDelete,
}: {
  lesson: Lesson | undefined
  lessonId: string
  unitId: string
  onRequestDelete: (lesson: Lesson) => void
}) {
  const { selection, dispatch } = useStudio()
  const [renaming, setRenaming] = useState(false)
  const data: DragData = { kind: 'lesson', unitId, lessonId }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `lesson:${unitId}:${lessonId}`, data })

  const selected = isSelected(selection, { kind: 'lesson', lessonId })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-40')}
    >
      <TreeItem
        selected={selected}
        muted={!selected}
        danger={!lesson}
        title={lesson ? 'Double-click to rename' : undefined}
        label={lesson ? lesson.title : `Missing lesson: ${lessonId}`}
        icon={<LessonGlyph lesson={lesson} selected={selected} />}
        leading={
          <DragHandle
            label={`Reorder ${lesson?.title ?? lessonId}`}
            dragging={isDragging}
            attributes={attributes}
            listeners={listeners}
          />
        }
        trailing={lesson ? <Count value={lesson.activities.length} /> : null}
        onSelect={() =>
          dispatch({ type: 'select', selection: { kind: 'lesson', lessonId } })
        }
        onDoubleClick={() => lesson && setRenaming(true)}
        replaceLabel={
          renaming && lesson ? (
            <InlineRename
              value={lesson.title}
              onCancel={() => setRenaming(false)}
              onCommit={(title) => {
                setRenaming(false)
                dispatch({ type: 'updateLesson', lessonId, patch: { title } })
              }}
            />
          ) : undefined
        }
        actions={
          <>
            <IconButton
              label="Duplicate lesson"
              size="sm"
              disabled={!lesson}
              onClick={() => dispatch({ type: 'duplicateLesson', lessonId })}
            >
              <Copy size={11} />
            </IconButton>
            <IconButton
              label="Remove from unit"
              size="sm"
              onClick={() => dispatch({ type: 'detachLesson', lessonId, unitId })}
            >
              <Unlink size={11} />
            </IconButton>
            <IconButton
              label="Delete lesson"
              size="sm"
              tone="danger"
              onClick={() => {
                if (lesson) onRequestDelete(lesson)
                else dispatch({ type: 'detachLesson', lessonId, unitId })
              }}
            >
              <Trash2 size={11} />
            </IconButton>
          </>
        }
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Unit folder
 * ------------------------------------------------------------------ */

function UnitBlock({
  unit,
  onRequestDelete,
  onRequestDeleteLesson,
}: {
  unit: Unit
  onRequestDelete: (unit: Unit) => void
  onRequestDeleteLesson: (lesson: Lesson) => void
}) {
  const { selection, dispatch } = useStudio()
  const [renaming, setRenaming] = useState(false)
  const lessonMap = useLessonMap()
  const data: DragData = { kind: 'unit', unitId: unit.id }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `unit:${unit.id}`, data })

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
      className={cn(isDragging && 'opacity-40')}
    >
      <TreeFolder
        id={unit.id}
        selected={selected}
        title="Double-click to rename"
        label={unit.title || 'Untitled unit'}
        danger={!unit.title}
        icon={
          <Icon
            size={13}
            className={cn('shrink-0', unit.isBoss ? 'text-boss' : 'text-unit')}
          />
        }
        leading={
          <DragHandle
            label={`Reorder ${unit.title}`}
            dragging={isDragging}
            attributes={attributes}
            listeners={listeners}
          />
        }
        trailing={
          <>
            {unit.isBoss ? (
              <span className="chip shrink-0 bg-boss-soft text-boss">boss</span>
            ) : null}
            <Count value={unit.lessonIds.length} />
          </>
        }
        onSelect={() =>
          dispatch({ type: 'select', selection: { kind: 'unit', unitId: unit.id } })
        }
        onDoubleClick={() => setRenaming(true)}
        replaceLabel={
          renaming ? (
            <InlineRename
              value={unit.title}
              onCancel={() => setRenaming(false)}
              onCommit={(title) => {
                setRenaming(false)
                dispatch({ type: 'updateUnit', unitId: unit.id, patch: { title } })
              }}
            />
          ) : undefined
        }
        actions={
          <>
            <IconButton
              label="Add lesson"
              size="sm"
              onClick={() => {
                dispatch({ type: 'expandUnit', unitId: unit.id })
                dispatch({ type: 'addLesson', unitId: unit.id })
              }}
            >
              <Plus size={12} />
            </IconButton>
            <IconButton
              label="Duplicate unit"
              size="sm"
              onClick={() => dispatch({ type: 'duplicateUnit', unitId: unit.id })}
            >
              <Copy size={11} />
            </IconButton>
            <IconButton
              label="Delete unit"
              size="sm"
              tone="danger"
              onClick={() => onRequestDelete(unit)}
            >
              <Trash2 size={11} />
            </IconButton>
          </>
        }
        bodyRef={setDropRef}
        bodyClassName={cn(isOver && 'rounded-md bg-accent-soft/60')}
        footer={
          unit.lessonIds.length === 0 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'addLesson', unitId: unit.id })}
              className="ml-5 flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[12.5px] text-ink-faint transition-colors duration-150 hover:bg-edge-soft hover:text-ink-muted"
            >
              <Plus size={12} /> Add lesson
            </button>
          ) : null
        }
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
              onRequestDelete={onRequestDeleteLesson}
            />
          ))}
        </SortableContext>
      </TreeFolder>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Tree
 * ------------------------------------------------------------------ */

export function CurriculumTree() {
  const { curriculum, selection, collapsedUnits, dispatch } = useStudio()
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [unitPendingDelete, setUnitPendingDelete] = useState<Unit | null>(null)
  const [lessonPendingDelete, setLessonPendingDelete] = useState<Lesson | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const orphans = useMemo(() => {
    const referenced = new Set(curriculum.units.flatMap((unit) => unit.lessonIds))
    return curriculum.lessons.filter((lesson) => !referenced.has(lesson.id))
  }, [curriculum])

  /* The store keeps the inverse (collapsed); the tree wants the open set. */
  const openIds = useMemo(
    () =>
      curriculum.units
        .map((unit) => unit.id)
        .filter((id) => !collapsedUnits.includes(id)),
    [curriculum.units, collapsedUnits],
  )

  function handleOpenIdsChange(next: string[]) {
    const before = new Set(openIds)
    const after = new Set(next)
    for (const unit of curriculum.units) {
      if (before.has(unit.id) !== after.has(unit.id)) {
        dispatch({ type: 'toggleUnit', unitId: unit.id })
      }
    }
  }

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

  const chapterSelected = selection.kind === 'chapter'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between px-3">
        <h2 className="field-eyebrow">Curriculum</h2>
        <span
          className="text-[11px] tabular-nums text-ink-faint"
          title={`${pluralize(curriculum.units.length, 'unit')}, ${pluralize(
            curriculum.lessons.length,
            'lesson',
          )}`}
        >
          {curriculum.units.length} · {curriculum.lessons.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {/* Chapter root */}
        <div className="group/row relative mb-1">
          <span
            aria-hidden
            className={cn(
              'absolute top-1 bottom-1 left-0 w-[2px] rounded-full transition-opacity duration-150',
              chapterSelected ? 'bg-accent opacity-100' : 'opacity-0',
            )}
          />
          <button
            type="button"
            onClick={() => dispatch({ type: 'select', selection: { kind: 'chapter' } })}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md py-1.5 pr-1.5 pl-1.5 text-left transition-colors duration-150',
              chapterSelected ? 'bg-accent-soft' : 'hover:bg-edge-soft',
            )}
          >
            <CHAPTER_ICON size={14} className="shrink-0 text-chapter" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">
                {curriculum.chapter.title || 'Untitled chapter'}
              </span>
              <span className="block truncate text-[11px] text-ink-faint">
                Chapter {curriculum.chapter.number} · {curriculum.chapter.id}
              </span>
            </span>
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <TreeView openIds={openIds} onOpenIdsChange={handleOpenIdsChange}>
            <SortableContext
              items={curriculum.units.map((unit) => `unit:${unit.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {curriculum.units.map((unit) => (
                <UnitBlock
                  key={unit.id}
                  unit={unit}
                  onRequestDelete={setUnitPendingDelete}
                  onRequestDeleteLesson={setLessonPendingDelete}
                />
              ))}
            </SortableContext>
          </TreeView>

          <DragOverlay dropAnimation={null}>
            {dragLabel ? (
              <div className="cursor-grabbing rounded-md border border-edge bg-panel px-2.5 py-1.5 text-[13px] text-ink shadow-(--shadow-drag)">
                {dragLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <button
          type="button"
          onClick={() => dispatch({ type: 'addUnit' })}
          className="mt-1.5 flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-[12.5px] text-ink-faint transition-colors duration-150 hover:bg-edge-soft hover:text-ink"
        >
          <Plus size={13} /> Add unit
        </button>

        {orphans.length > 0 ? (
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between px-1.5">
              <h3 className="field-eyebrow text-warning">Unassigned</h3>
              <span
                className="text-[11px] text-ink-faint"
                title={`${pluralize(orphans.length, 'lesson')} not referenced by any unit`}
              >
                {orphans.length}
              </span>
            </div>
            <div className="tree-view">
              {orphans.map((lesson) => {
                const selected = isSelected(selection, {
                  kind: 'lesson',
                  lessonId: lesson.id,
                })
                return (
                  <TreeItem
                    key={lesson.id}
                    selected={selected}
                    muted={!selected}
                    label={lesson.title}
                    icon={<LessonGlyph lesson={lesson} selected={selected} />}
                    trailing={<Count value={lesson.activities.length} />}
                    onSelect={() =>
                      dispatch({
                        type: 'select',
                        selection: { kind: 'lesson', lessonId: lesson.id },
                      })
                    }
                  />
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      <DeleteUnitDialog
        unit={unitPendingDelete}
        onClose={() => setUnitPendingDelete(null)}
      />

      <ConfirmDialog
        open={lessonPendingDelete !== null}
        title={`Delete “${lessonPendingDelete?.title ?? ''}”?`}
        description="The lesson is removed from the lessons array and from every unit that references it."
        confirmLabel="Delete lesson"
        onCancel={() => setLessonPendingDelete(null)}
        onConfirm={() => {
          if (lessonPendingDelete) {
            dispatch({ type: 'deleteLesson', lessonId: lessonPendingDelete.id })
          }
          setLessonPendingDelete(null)
        }}
      />
    </div>
  )
}
