import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Lightbulb, RotateCcw, X } from 'lucide-react'
import type { Activity, Lesson } from '@/types/curriculum'
import { ACTIVITY_TYPE_LABELS } from '@/types/curriculum'
import { cn } from '@/lib/utils'
import { ACTIVITY_ICONS, ACTIVITY_INK } from '@/lib/icons'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

function ExplanationView({
  activity,
}: {
  activity: Extract<Activity, { type: 'explanation' }>
}) {
  return (
    <>
      {activity.visual ? (
        <span className="chip mb-3 border border-edge bg-panel-2 text-ink-faint">
          visual · {activity.visual}
        </span>
      ) : null}
      <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-ink-muted">
        {activity.content}
      </p>
    </>
  )
}

/**
 * Walks the lesson's `activities` array in its stored order — the same sequence
 * the consuming app will render. Deliberately styled apart from the editor
 * chrome so it reads as the student-facing surface.
 */
export function PreviewDialog({
  lesson,
  open,
  onClose,
}: {
  lesson: Lesson | undefined
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState<number | boolean | null>(null)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(0)
      setChoice(null)
      setTyped('')
      setRevealed(false)
    }
  }, [open, lesson?.id])

  if (!lesson) return null

  const total = lesson.activities.length
  const activity = lesson.activities[step]
  const done = step >= total

  const reset = () => {
    setChoice(null)
    setTyped('')
    setRevealed(false)
  }

  const goNext = () => {
    setStep((current) => current + 1)
    reset()
  }

  const goBack = () => {
    setStep((current) => Math.max(0, current - 1))
    reset()
  }

  const answeredCorrectly = (() => {
    if (!activity) return false
    switch (activity.type) {
      case 'multiple_choice':
        return choice === activity.answer
      case 'true_false':
        return choice === activity.answer
      case 'fill_blank': {
        const accepted = [activity.answer, ...(activity.acceptableAnswers ?? [])]
        return accepted.some(
          (value) => value.trim().toLowerCase() === typed.trim().toLowerCase(),
        )
      }
      default:
        return true
    }
  })()

  const canContinue = !activity || activity.type === 'explanation' || revealed
  const TypeIcon = activity ? ACTIVITY_ICONS[activity.type] : null

  const optionClass = (picked: boolean, isAnswer: boolean) =>
    cn(
      'w-full rounded-xl border px-4 py-3 text-left text-[14px] transition-colors duration-150',
      revealed && isAnswer
        ? 'border-success/40 bg-success-soft text-success'
        : picked
          ? 'border-danger/40 bg-danger-soft text-danger'
          : 'border-edge bg-panel text-ink hover:border-edge-strong hover:bg-panel-2',
      revealed && 'cursor-default',
    )

  return (
    <Modal open={open} onClose={onClose} size="md" bare>
      <div className="flex items-center gap-2.5 border-b border-edge px-4 py-2.5">
        <span className="text-[16px] leading-none">{lesson.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{lesson.title}</p>
          <p className="text-[11.5px] tabular-nums text-ink-faint">
            {done ? 'Complete' : `Activity ${step + 1} of ${total}`}
          </p>
        </div>
        <span className="chip border border-edge bg-panel-2 text-ink-faint">Preview</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="rounded-md p-1 text-ink-faint transition-colors duration-150 hover:bg-edge-soft hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>

      <div className="h-0.5 bg-edge-soft">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${total === 0 ? 100 : (Math.min(step, total) / total) * 100}%` }}
        />
      </div>

      <div className="min-h-[300px] bg-canvas px-7 py-7">
        {done ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-success/20 bg-success-soft text-success">
              <Check size={20} />
            </div>
            <p className="text-[15px] font-semibold text-ink">End of lesson</p>
            <p className="mt-1 text-[13px] text-ink-faint">
              {total} activities in stored order.
            </p>
            <Button className="mt-5" onClick={() => setStep(0)}>
              <RotateCcw size={14} /> Replay
            </Button>
          </div>
        ) : activity ? (
          <>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
              {TypeIcon ? (
                <TypeIcon size={12} className={ACTIVITY_INK[activity.type]} />
              ) : null}
              <span className={ACTIVITY_INK[activity.type]}>
                {ACTIVITY_TYPE_LABELS[activity.type]}
              </span>
            </p>
            <h3 className="mb-4 text-[20px] leading-tight font-semibold tracking-[-0.01em] text-ink">
              {activity.title}
            </h3>

            {activity.type === 'explanation' ? (
              <ExplanationView activity={activity} />
            ) : null}

            {activity.type === 'multiple_choice' ? (
              <>
                <p className="mb-4 text-[14.5px] leading-relaxed text-ink-muted">
                  {activity.question}
                </p>
                <div className="space-y-2">
                  {activity.options.map((option, index) => (
                    <button
                      key={`${option}-${index}`}
                      type="button"
                      disabled={revealed}
                      onClick={() => {
                        setChoice(index)
                        setRevealed(true)
                      }}
                      className={optionClass(choice === index, index === activity.answer)}
                    >
                      {option || <span className="italic">Empty option</span>}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {activity.type === 'true_false' ? (
              <>
                <p className="mb-4 text-[14.5px] leading-relaxed text-ink-muted">
                  {activity.statement}
                </p>
                <div className="flex gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      disabled={revealed}
                      onClick={() => {
                        setChoice(value)
                        setRevealed(true)
                      }}
                      className={cn(
                        optionClass(choice === value, value === activity.answer),
                        'flex-1 text-center font-medium',
                      )}
                    >
                      {value ? 'True' : 'False'}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {activity.type === 'fill_blank' ? (
              <>
                <p className="mb-4 text-[14.5px] leading-relaxed text-ink-muted">
                  {activity.prompt}
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    setRevealed(true)
                  }}
                  className="flex gap-2"
                >
                  <input
                    className="field-input flex-1"
                    placeholder="Type your answer"
                    aria-label="Your answer"
                    value={typed}
                    disabled={revealed}
                    onChange={(event) => setTyped(event.target.value)}
                  />
                  <Button variant="outline" type="submit" disabled={revealed}>
                    Check
                  </Button>
                </form>
              </>
            ) : null}

            {activity.type !== 'explanation' && activity.hint && !revealed ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-edge bg-panel px-3 py-2 text-[12.5px] text-ink-muted">
                <Lightbulb size={13} className="mt-0.5 shrink-0 text-warning" />
                {activity.hint}
              </p>
            ) : null}

            {revealed && activity.type !== 'explanation' ? (
              <div
                className={cn(
                  'mt-4 rounded-xl border-l-2 px-4 py-3 text-[13.5px]',
                  answeredCorrectly
                    ? 'border-l-success bg-success-soft'
                    : 'border-l-danger bg-danger-soft',
                )}
              >
                <p
                  className={cn(
                    'font-medium',
                    answeredCorrectly ? 'text-success' : 'text-danger',
                  )}
                >
                  {answeredCorrectly ? 'Correct' : 'Not quite'}
                  {activity.type === 'fill_blank' && !answeredCorrectly
                    ? ` — expected “${activity.answer}”`
                    : ''}
                </p>
                {activity.explanation ? (
                  <p className="mt-1 leading-relaxed text-ink-muted">
                    {activity.explanation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {done ? null : (
        <div className="flex items-center justify-between border-t border-edge px-4 py-2.5">
          <Button variant="ghost" disabled={step === 0} onClick={goBack}>
            <ArrowLeft size={14} /> Back
          </Button>
          <span className="text-[11.5px] tabular-nums text-ink-faint">
            {step + 1} / {total}
          </span>
          <Button variant="primary" disabled={!canContinue} onClick={goNext}>
            Continue
          </Button>
        </div>
      )}
    </Modal>
  )
}
