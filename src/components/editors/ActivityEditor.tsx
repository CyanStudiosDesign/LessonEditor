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
import { useStudio } from '@/state/store'
import {
  Field,
  IdField,
  TextAreaField,
  TextField,
} from '@/components/ui/Field'
import { Button, IconButton } from '@/components/ui/Button'

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
        'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition',
        correct ? 'border-success/40 bg-success/5' : 'border-edge bg-panel-2',
        isDragging && 'relative z-10 shadow-lg shadow-black/40',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-ink-faint/60 hover:text-ink active:cursor-grabbing"
        aria-label={`Reorder option ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <input
        className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none"
        value={option}
        placeholder={`Option ${index + 1}`}
        onChange={(event) => onChange(event.target.value)}
      />

      <button
        type="button"
        onClick={onSelectCorrect}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase transition',
          correct
            ? 'bg-success/15 text-success'
            : 'text-ink-faint hover:bg-edge-soft hover:text-ink-muted',
        )}
      >
        <span
          className={cn(
            'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
            correct ? 'border-success bg-success text-canvas' : 'border-ink-faint',
          )}
        >
          {correct ? <Check size={9} strokeWidth={4} /> : null}
        </span>
        Correct
      </button>

      <IconButton
        label="Remove option"
        className="hover:text-danger"
        disabled={!canRemove}
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
    dispatch({
      type: 'reorderOptions',
      lessonId,
      activityId: activity.id,
      from,
      to,
    })
  }

  return (
    <div className="card px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          {(id) => (
            <select
              id={id}
              className="field-input"
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
              className="sm:col-span-2"
              label="Visual (optional)"
              mono
              placeholder="array"
              value={activity.visual ?? ''}
              onChange={(visual) => patch({ visual })}
              hint="Omitted from the export when empty."
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
              <span className="field-label">Options</span>
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
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge py-1.5 text-xs text-ink-faint transition hover:border-accent/50 hover:text-ink"
              >
                <Plus size={13} /> Add option
              </button>
              <p className="mt-1.5 text-xs text-ink-faint">
                <code className="font-mono">answer</code> is the zero-based index —
                currently {activity.answer}. Reordering options moves it with the option.
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
                      onClick={() => patch({ answer: value })}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition',
                        activity.answer === value
                          ? 'border-success/50 bg-success/10 text-success'
                          : 'border-edge bg-panel-2 text-ink-muted hover:text-ink',
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
              label="Acceptable answers (optional)"
              value={(activity.acceptableAnswers ?? []).join(', ')}
              placeholder="zero, nil"
              onChange={(value) => {
                const list = value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                patch({ acceptableAnswers: list.length > 0 ? list : undefined })
              }}
              hint="Comma separated. Omitted when empty."
            />
          </>
        ) : null}

        {activity.type !== 'explanation' ? (
          <>
            <TextAreaField
              label="Explanation (optional)"
              rows={2}
              value={activity.explanation ?? ''}
              onChange={(explanation) => patch({ explanation })}
            />
            <TextAreaField
              label="Hint (optional)"
              rows={2}
              value={activity.hint ?? ''}
              onChange={(hint) => patch({ hint })}
            />
          </>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-edge pt-4">
        <p className="font-mono text-[11px] text-ink-faint">
          {lessonId} › {activity.id}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              dispatch({ type: 'duplicateActivity', lessonId, activityId: activity.id })
            }
          >
            <Copy size={14} /> Duplicate
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              dispatch({ type: 'deleteActivity', lessonId, activityId: activity.id })
            }
          >
            <Trash2 size={14} /> Delete Activity
          </Button>
        </div>
      </div>
    </div>
  )
}
