import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Play, Plus, Trash2 } from 'lucide-react'
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
  type Lesson,
} from '@/types/curriculum'
import { cn } from '@/lib/utils'
import { ACTIVITY_ACCENTS, ACTIVITY_ICONS } from '@/lib/icons'
import { useStudio } from '@/state/store'
import {
  CheckField,
  IdField,
  NumberField,
  TextAreaField,
  TextField,
} from '@/components/ui/Field'
import { Button, IconButton } from '@/components/ui/Button'
import { EditorShell, Section } from '@/components/editors/EditorShell'
import { ActivityEditor } from '@/components/editors/ActivityEditor'
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog'

function activitySummary(activity: Activity): string {
  switch (activity.type) {
    case 'explanation':
      return activity.content
    case 'multiple_choice':
      return activity.question
    case 'true_false':
      return activity.statement
    case 'fill_blank':
      return activity.prompt
  }
}

function ActivityRow({
  activity,
  lessonId,
  index,
  selected,
}: {
  activity: Activity
  lessonId: string
  index: number
  selected: boolean
}) {
  const { dispatch } = useStudio()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: activity.id })

  const Icon = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.explanation

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group/act flex items-center gap-2 border-b border-edge px-2 py-2 last:border-b-0',
        isDragging && 'relative z-10 rounded-lg bg-panel-2 shadow-lg shadow-black/40',
        selected && 'bg-accent-soft',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-ink-faint/60 hover:text-ink active:cursor-grabbing"
        aria-label={`Reorder ${activity.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <span className="w-4 text-center text-[11px] tabular-nums text-ink-faint">
        {index + 1}
      </span>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-left"
        onClick={() =>
          dispatch({
            type: 'select',
            selection: { kind: 'activity', lessonId, activityId: activity.id },
          })
        }
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
            ACTIVITY_ACCENTS[activity.type] ?? 'border-edge text-ink-faint',
          )}
        >
          <Icon size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">
            {activity.title || <span className="text-danger italic">Untitled</span>}
          </span>
          <span className="block truncate text-[11px] text-ink-faint">
            {ACTIVITY_TYPE_LABELS[activity.type] ?? activity.type} ·{' '}
            {activitySummary(activity) || 'No content yet'}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center opacity-0 transition group-hover/act:opacity-100">
        <IconButton
          label="Duplicate activity"
          onClick={() =>
            dispatch({ type: 'duplicateActivity', lessonId, activityId: activity.id })
          }
        >
          <Copy size={12} />
        </IconButton>
        <IconButton
          label="Delete activity"
          className="hover:text-danger"
          onClick={() =>
            dispatch({ type: 'deleteActivity', lessonId, activityId: activity.id })
          }
        >
          <Trash2 size={12} />
        </IconButton>
      </div>
    </div>
  )
}

export function LessonEditor({
  lesson,
  selectedActivityId,
  onPreview,
}: {
  lesson: Lesson
  selectedActivityId?: string
  onPreview: () => void
}) {
  const { curriculum, dispatch } = useStudio()
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const owner = curriculum.units.find((unit) => unit.lessonIds.includes(lesson.id))
  const selectedActivity = lesson.activities.find(
    (activity) => activity.id === selectedActivityId,
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = lesson.activities.findIndex((item) => item.id === active.id)
    const to = lesson.activities.findIndex((item) => item.id === over.id)
    if (from < 0 || to < 0) return
    dispatch({ type: 'reorderActivities', lessonId: lesson.id, from, to })
  }

  return (
    <EditorShell
      eyebrow={owner ? `Unit · ${owner.title}` : 'Lesson · unassigned'}
      title={
        <span className="flex items-center gap-2">
          <span>{lesson.icon || '📘'}</span>
          {lesson.title || 'Untitled lesson'}
        </span>
      }
      actions={
        <>
          <Button onClick={onPreview} disabled={lesson.activities.length === 0}>
            <Play size={14} /> Preview
          </Button>
          <Button onClick={() => dispatch({ type: 'duplicateLesson', lessonId: lesson.id })}>
            <Copy size={14} /> Duplicate
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Delete
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <IdField
          value={lesson.id}
          onCommit={(id) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { id } })
          }
          hint="Renaming rewrites every lessonIds reference."
        />
        <TextField
          label="Title"
          value={lesson.title}
          onChange={(title) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { title } })
          }
        />
        <TextAreaField
          className="sm:col-span-2"
          label="Description"
          rows={2}
          value={lesson.description}
          onChange={(description) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { description } })
          }
        />
        <TextField
          label="Skill"
          value={lesson.skill}
          onChange={(skill) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { skill } })
          }
        />
        <TextField
          label="Icon"
          value={lesson.icon}
          placeholder="🧱"
          onChange={(icon) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { icon } })
          }
        />
        <NumberField
          label="Estimated minutes"
          min={0}
          value={lesson.estimatedMinutes}
          onChange={(estimatedMinutes) =>
            dispatch({
              type: 'updateLesson',
              lessonId: lesson.id,
              patch: { estimatedMinutes },
            })
          }
        />
        <NumberField
          label="Order"
          value={lesson.order}
          onChange={(order) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { order } })
          }
        />
        <div className="sm:col-span-2">
          <CheckField
            label="Boss lesson"
            description="Adds isBoss: true to this lesson."
            checked={lesson.isBoss === true}
            onChange={(isBoss) =>
              dispatch({
                type: 'updateLesson',
                lessonId: lesson.id,
                patch: { isBoss: isBoss ? true : undefined },
              })
            }
          />
        </div>
      </div>

      <Section
        title="Activities"
        description="Order here is the exact order of the activities array."
        actions={
          <div className="relative">
            <Button variant="primary" onClick={() => setAddOpen((open) => !open)}>
              <Plus size={14} /> Add Activity
            </Button>
            {addOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setAddOpen(false)}
                />
                <div className="animate-pop absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-edge bg-panel shadow-xl shadow-black/40">
                  {ACTIVITY_TYPES.map((type: ActivityType) => {
                    const Icon = ACTIVITY_ICONS[type]
                    return (
                      <button
                        key={type}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-muted hover:bg-panel-2 hover:text-ink"
                        onClick={() => {
                          setAddOpen(false)
                          dispatch({
                            type: 'addActivity',
                            lessonId: lesson.id,
                            activityType: type,
                          })
                        }}
                      >
                        <Icon size={14} /> {ACTIVITY_TYPE_LABELS[type]}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}
          </div>
        }
      >
        <div className="card overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lesson.activities.map((activity) => activity.id)}
              strategy={verticalListSortingStrategy}
            >
              {lesson.activities.map((activity, index) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  lessonId={lesson.id}
                  index={index}
                  selected={activity.id === selectedActivityId}
                />
              ))}
            </SortableContext>
          </DndContext>

          {lesson.activities.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">
              No activities yet. Add one, or paste JSON with Import.
            </p>
          ) : null}
        </div>
      </Section>

      {selectedActivity ? (
        <Section title={`Editing · ${ACTIVITY_TYPE_LABELS[selectedActivity.type]}`}>
          <ActivityEditor lessonId={lesson.id} activity={selectedActivity} />
        </Section>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${lesson.title}”?`}
        description="The lesson is removed from the lessons array and from every unit that references it."
        confirmLabel="Delete lesson"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          dispatch({ type: 'deleteLesson', lessonId: lesson.id })
        }}
      />
    </EditorShell>
  )
}
