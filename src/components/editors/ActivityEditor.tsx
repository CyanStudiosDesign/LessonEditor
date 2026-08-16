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
import { Check, Copy, GripVertical, Plus, Trash2, X } from 'lucide-react'
import {
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
} from '@/types/curriculum'
import { cn } from '@/lib/utils'
import { ACTIVITY_ACCENTS, ACTIVITY_ICONS } from '@/lib/icons'
import { useStudio } from '@/state/store'
import { Field, IdField, TextAreaField, TextField } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/Button'

/** Switching type keeps id + title and drops fields the new type has no place for. */
function convert(activity: Activity, type: ActivityType): Activity {
  const base = { id: activity.id, title: activity.title }
  const explanation = 'explanation' in activity ? activity.explanation : undefined
  const hint = 'hint' in activity ? activity.hint : undefined

  switch (type) {
    case 'explanation':
      return {
        ...base,
        type,
        content: activity.type === 'explanation' ? activity.content : '',
      }
    case 'multiple_choice':
      return {
        ...base,
        type,
        question: activity.type === 'multiple_choice' ? activity.question : '',
        options: activity.type === 'multiple_choice' ? activity.options : ['', ''],
        answer: activity.type === 'multiple_choice' ? activity.answer : 0,
        explanation,
        hint,
      }
    case 'true_false':
      return {
        ...base,
        type,
        statement: activity.type === 'true_false' ? activity.statement : '',
        answer: activity.type === 'true_false' ? activity.answer : true,
        explanation,
        hint,
      }
    case 'fill_blank':
      return {
        ...base,
        type,
        prompt: activity.type === 'fill_blank' ? activity.prompt : '',
        answer: activity.type === 'fill_blank' ? activity.answer : '',
        acceptableAnswers:
          activity.type === 'fill_blank' ? activity.acceptableAnswers : undefined,
        hint,
        explanation,
      }
  }
}

function OptionRow({
  option,
  index,
  correct,
  onChange,
  onRemove,
  onSelectCorrect,
  canRemove,
}: {
  option: string
  index: number
  correct: boolean
  onChange: (value: string) => void
  onRemove: () => void
  onSelectCorrect: () => void
  canRemove: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `option-${index}` })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-1.5 rounded-lg border pr-1 pl-1.5',
        'transition-colors duration-150',
        correct
          ? 'border-success/35 bg-success-soft'
          : 'border-edge bg-panel hover:border-edge-strong',
        isDragging && 'z-10 border-transparent shadow-(--shadow-drag)',
      )}
    >
      <button
        type="button"
        title="Drag to reorder"
        className={cn(
          'shrink-0 cursor-grab touch-none rounded p-0.5 text-edge-strong transition-colors duration-150',
          'group-hover:text-ink-faint hover:!text-ink active:cursor-grabbing',
          isDragging && 'text-ink',
        )}
        aria-label={`Reorder option ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <input
        className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none"
        value={option}
        aria-label={`Option ${index + 1}`}
        placeholder={`Option ${index + 1}`}
        onChange={(event) => onChange(event.target.value)}
      />

      {/* The radio is always visible so the answer is readable at a glance;
          only the word "Correct" is reserved for the chosen option. */}
      <button
        type="button"
        onClick={onSelectCorrect}
        aria-pressed={correct}
        title={correct ? 'This is the correct answer' : 'Mark as the correct answer'}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-semibold',
          'tracking-[0.02em] uppercase transition-colors duration-150',
          correct ? 'text-success' : 'text-ink-faint hover:text-ink-muted',
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150',
            correct
              ? 'border-success bg-success text-white'
              : 'border-edge-strong group-hover:border-ink-faint',
          )}
        >
          {correct ? <Check size={10} strokeWidth={3.5} /> : null}
        </span>
        {correct ? 'Correct' : <span className="sr-only">Mark correct</span>}
      </button>

      <IconButton
        label="Remove option"
        size="sm"
        tone="danger"
        disabled={!canRemove}
        className={cn(!canRemove && 'opacity-0')}
        onClick={onRemove}
      >
        <X size={13} />
      </IconButton>
    </div>
  )
}

export function ActivityEditor({
  lessonId,
  activity,
}: {
  lessonId: string
  activity: Activity
}) {
  const { dispatch } = useStudio()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const update = (next: Activity) =>
    dispatch({ type: 'updateActivity', lessonId, activityId: activity.id, activity: next })

  const patch = (fields: Partial<Activity>) =>
    update({ ...activity, ...fields } as Activity)

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || activity.type !== 'multiple_choice') return
    const from = Number(String(active.id).replace('option-', ''))
    const to = Number(String(over.id).replace('option-', ''))
    if (Number.isNaN(from) || Number.isNaN(to)) return
    dispatch({ type: 'reorderOptions', lessonId, activityId: activity.id, from, to })
  }

  const Icon = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.explanation

  return (
    <div className="card overflow-hidden">
      {/* Consistent shell header for every activity type. */}
      <header className="flex items-center gap-2.5 border-b border-edge-soft bg-panel-2 px-4 py-2.5">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
            ACTIVITY_ACCENTS[activity.type],
          )}
        >
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </p>
          <p className="truncate font-mono text-[11.5px] text-ink-faint">{activity.id}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label="Duplicate activity"
            onClick={() =>
              dispatch({ type: 'duplicateActivity', lessonId, activityId: activity.id })
            }
          >
            <Copy size={13} />
          </IconButton>
          <IconButton
            label="Delete activity"
            tone="danger"
            onClick={() =>
              dispatch({ type: 'deleteActivity', lessonId, activityId: activity.id })
            }
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      </header>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
          label="Title"
          value={activity.title}
          onChange={(title) => patch({ title })}
        />

        {activity.type === 'explanation' ? (
          <>
            <TextAreaField
              className="sm:col-span-2"
              label="Content"
              rows={5}
              value={activity.content}
              onChange={(content) => patch({ content })}
            />
            <TextField
              label="Visual"
              mono
              placeholder="array"
              value={activity.visual ?? ''}
              onChange={(visual) => patch({ visual })}
              hint="Optional — omitted from the export when empty."
            />
          </>
        ) : null}

        {activity.type === 'multiple_choice' ? (
          <>
            <TextAreaField
              className="sm:col-span-2"
              label="Question"
              rows={2}
              value={activity.question}
              onChange={(question) => patch({ question })}
            />

            <div className="sm:col-span-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="field-label">Options</span>
                <span className="mb-1.5 font-mono text-[11px] text-ink-faint">
                  answer: {activity.answer}
                </span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleOptionDragEnd}
              >
                <SortableContext
                  items={activity.options.map((_, index) => `option-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {activity.options.map((option, index) => (
                      <OptionRow
                        key={`option-${index}`}
                        option={option}
                        index={index}
                        correct={activity.answer === index}
                        canRemove={activity.options.length > 2}
                        onSelectCorrect={() => patch({ answer: index })}
                        onChange={(value) => {
                          const options = activity.options.slice()
                          options[index] = value
                          patch({ options })
                        }}
                        onRemove={() => {
                          const options = activity.options.filter((_, i) => i !== index)
                          let answer = activity.answer
                          if (answer === index) answer = 0
                          else if (answer > index) answer -= 1
                          update({ ...activity, options, answer })
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                type="button"
                onClick={() => patch({ options: [...activity.options, ''] })}
                className="mt-1.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge text-[12.5px] text-ink-faint transition-colors duration-150 hover:border-edge-strong hover:bg-panel-2 hover:text-ink-muted"
              >
                <Plus size={13} /> Add option
              </button>
              <p className="mt-2 text-[12px] leading-snug text-ink-faint">
                <code className="font-mono">answer</code> is the zero-based index.
                Reordering options moves it with its option.
              </p>
            </div>
          </>
        ) : null}

        {activity.type === 'true_false' ? (
          <>
            <TextAreaField
              className="sm:col-span-2"
              label="Statement"
              rows={2}
              value={activity.statement}
              onChange={(statement) => patch({ statement })}
            />
            <Field label="Answer" className="sm:col-span-2">
              {() => (
                <div className="flex gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={activity.answer === value}
                      onClick={() => patch({ answer: value })}
                      className={cn(
                        'h-9 flex-1 rounded-lg border text-[13.5px] font-medium',
                        'transition-colors duration-150',
                        activity.answer === value
                          ? 'border-success/35 bg-success-soft text-success'
                          : 'border-edge bg-panel text-ink-muted hover:border-edge-strong hover:text-ink',
                      )}
                    >
                      {value ? 'True' : 'False'}
                    </button>
                  ))}
                </div>
              )}
            </Field>
          </>
        ) : null}

        {activity.type === 'fill_blank' ? (
          <>
            <TextAreaField
              className="sm:col-span-2"
              label="Prompt"
              rows={2}
              value={activity.prompt}
              onChange={(prompt) => patch({ prompt })}
              hint="Use ____ to mark the blank."
            />
            <TextField
              label="Answer"
              value={activity.answer}
              onChange={(answer) => patch({ answer })}
            />
            <TextField
              label="Acceptable answers"
              value={(activity.acceptableAnswers ?? []).join(', ')}
              placeholder="zero, nil"
              onChange={(value) => {
                const list = value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                patch({ acceptableAnswers: list.length > 0 ? list : undefined })
              }}
              hint="Optional, comma separated. Omitted when empty."
            />
          </>
        ) : null}

        {activity.type !== 'explanation' ? (
          <>
            <TextAreaField
              label="Explanation"
              rows={2}
              value={activity.explanation ?? ''}
              onChange={(explanation) => patch({ explanation })}
              hint="Optional — shown after answering."
            />
            <TextAreaField
              label="Hint"
              rows={2}
              value={activity.hint ?? ''}
              onChange={(hint) => patch({ hint })}
              hint="Optional — shown before answering."
            />
          </>
        ) : null}
      </div>

      {/* Structural fields sit apart from the content fields. */}
      <div className="grid gap-4 border-t border-edge-soft bg-panel-2 px-4 py-3.5 sm:grid-cols-2">
        <Field label="Type">
          {(id) => (
            <select
              id={id}
              className="field-input cursor-pointer"
              value={activity.type}
              onChange={(event) =>
                update(convert(activity, event.target.value as ActivityType))
              }
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <IdField
          value={activity.id}
          onCommit={(id) => update({ ...activity, id } as Activity)}
        />
      </div>
    </div>
  )
}
