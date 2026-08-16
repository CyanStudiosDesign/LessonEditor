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
import { Clock, Copy, GripVertical, LayoutList, Play, Plus, Trash2 } from 'lucide-react'
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
  type Lesson,
} from '@/types/curriculum'
import { cn, pluralize } from '@/lib/utils'
import { ACTIVITY_ACCENTS, ACTIVITY_ICONS, BOSS_ICON } from '@/lib/icons'
import { useStudio } from '@/state/store'
import {
  CheckField,
  IdField,
  NumberField,
  TextAreaField,
  TextField,
} from '@/components/ui/Field'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Modal'
import {
  EditorShell,
  MenuItem,
  MetaDot,
  MetaItem,
  OverflowMenu,
  Section,
} from '@/components/editors/EditorShell'
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
        'group relative flex items-center gap-2.5 border-b border-edge-soft px-2 py-2 last:border-b-0',
        'transition-colors duration-150',
        isDragging
          ? 'z-10 rounded-lg border-transparent bg-panel shadow-(--shadow-drag)'
          : selected
            ? 'bg-accent-soft'
            : 'hover:bg-panel-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0 bottom-0 left-0 w-[2px]',
          selected ? 'bg-accent' : 'bg-transparent',
        )}
      />

      <button
        type="button"
        title="Drag to reorder"
        className={cn(
          'shrink-0 cursor-grab touch-none rounded p-0.5 text-edge-strong transition-colors duration-150',
          'group-hover:text-ink-faint hover:!text-ink active:cursor-grabbing',
          isDragging && 'text-ink',
        )}
        aria-label={`Reorder ${activity.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <span className="w-4 shrink-0 text-center text-[11.5px] tabular-nums text-ink-faint">
        {index + 1}
      </span>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
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
          <span
            className={cn(
              'block truncate text-[13.5px]',
              selected ? 'font-medium text-ink' : 'text-ink',
            )}
          >
            {activity.title || <span className="text-danger italic">Untitled</span>}
          </span>
          <span className="block truncate text-[12px] text-ink-faint">
            <span className="text-ink-muted">
              {ACTIVITY_TYPE_LABELS[activity.type] ?? activity.type}
            </span>
            {' · '}
            {activitySummary(activity) || 'No content yet'}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <IconButton
          label="Duplicate activity"
          size="sm"
          onClick={() =>
            dispatch({ type: 'duplicateActivity', lessonId, activityId: activity.id })
          }
        >
          <Copy size={12} />
        </IconButton>
        <IconButton
          label="Delete activity"
          size="sm"
          tone="danger"
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

function AddActivityMenu({ lessonId }: { lessonId: string }) {
  const { dispatch } = useStudio()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="primary" onClick={() => setOpen((value) => !value)}>
        <Plus size={14} /> Add Activity
      </Button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="animate-pop absolute right-0 z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-edge bg-panel p-1 shadow-(--shadow-pop)"
          >
            {ACTIVITY_TYPES.map((type: ActivityType) => {
              const Icon = ACTIVITY_ICONS[type]
              return (
                <button
                  key={type}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-muted transition-colors duration-150 hover:bg-edge-soft hover:text-ink"
                  onClick={() => {
                    setOpen(false)
                    dispatch({ type: 'addActivity', lessonId, activityType: type })
                  }}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                      ACTIVITY_ACCENTS[type],
                    )}
                  >
                    <Icon size={12} />
                  </span>
                  {ACTIVITY_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
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
      icon={<span className="text-[20px] leading-none">{lesson.icon || '📘'}</span>}
      title={lesson.title || 'Untitled lesson'}
      meta={
        <>
          <MetaItem>
            <span className="id-tag">{lesson.id}</span>
          </MetaItem>
          {lesson.skill ? (
            <>
              <MetaDot />
              <MetaItem>{lesson.skill}</MetaItem>
            </>
          ) : null}
          <MetaDot />
          <MetaItem icon={<Clock size={12} />}>{lesson.estimatedMinutes} min</MetaItem>
          <MetaDot />
          <MetaItem icon={<LayoutList size={12} />}>
            {pluralize(lesson.activities.length, 'activity', 'activities')}
          </MetaItem>
          {lesson.isBoss ? (
            <>
              <MetaDot />
              <MetaItem icon={<BOSS_ICON size={12} className="text-boss" />}>
                <span className="text-boss">Boss lesson</span>
              </MetaItem>
            </>
          ) : null}
        </>
      }
      actions={
        <>
          <Button onClick={onPreview} disabled={lesson.activities.length === 0}>
            <Play size={14} /> Preview
          </Button>
          <OverflowMenu>
            {(close) => (
              <>
                <MenuItem
                  icon={<Copy size={14} />}
                  onClick={() => {
                    close()
                    dispatch({ type: 'duplicateLesson', lessonId: lesson.id })
                  }}
                >
                  Duplicate lesson
                </MenuItem>
                <MenuItem
                  icon={<Trash2 size={14} />}
                  tone="danger"
                  onClick={() => {
                    close()
                    setConfirmDelete(true)
                  }}
                >
                  Delete lesson
                </MenuItem>
              </>
            )}
          </OverflowMenu>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
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
        <IdField
          value={lesson.id}
          onCommit={(id) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { id } })
          }
          hint="Renaming rewrites every lessonIds reference."
        />
        <TextField
          label="Skill"
          value={lesson.skill}
          placeholder="Arrays"
          onChange={(skill) =>
            dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { skill } })
          }
        />
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-3 sm:col-span-2">
          <NumberField
            label="Estimated minutes"
            min={0}
            suffix="min"
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
          <TextField
            label="Icon"
            value={lesson.icon}
            placeholder="🧱"
            onChange={(icon) =>
              dispatch({ type: 'updateLesson', lessonId: lesson.id, patch: { icon } })
            }
          />
        </div>
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
        description="This order is the exact order of the activities array."
        actions={<AddActivityMenu lessonId={lesson.id} />}
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
            <EmptyState
              icon={<LayoutList size={17} />}
              title="No activities yet"
              description="Add an explanation, question or exercise — or paste JSON with Import."
            />
          ) : null}
        </div>
      </Section>

      {selectedActivity ? (
        <Section title="Edit activity">
          <ActivityEditor lessonId={lesson.id} activity={selectedActivity} />
        </Section>
      ) : lesson.activities.length > 0 ? (
        <p className="mt-3 text-center text-[12.5px] text-ink-faint">
          Select an activity above to edit it.
        </p>
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
