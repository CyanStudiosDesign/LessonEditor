import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Lightbulb, RotateCcw, X } from 'lucide-react'
import type { Activity, Lesson } from '@/types/curriculum'
import { ACTIVITY_TYPE_LABELS } from '@/types/curriculum'
import { cn } from '@/lib/utils'
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
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ink-muted">
        {activity.content}
      </p>
    </>
  )
}

/**
 * Walks the lesson's `activities` array in its stored order — the same sequence
 * the consuming app will render.
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

  const canContinue =
    !activity || activity.type === 'explanation' || revealed

  return (
    <Modal open={open} onClose={onClose} size="md" bare>
      <div className="flex items-center gap-3 border-b border-edge px-5 py-3">
        <span className="text-lg">{lesson.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{lesson.title}</p>
          <p className="text-[11px] text-ink-faint">
            {done ? 'Complete' : `Activity ${step + 1} of ${total}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="rounded-md p-1 text-ink-faint hover:bg-panel-2 hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      <div className="h-1 bg-panel-2">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${total === 0 ? 100 : (Math.min(step, total) / total) * 100}%` }}
        />
      </div>

      <div className="min-h-[280px] px-6 py-6">
        {done ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <Check size={22} />
            </div>
            <p className="text-lg font-semibold text-ink">Lesson complete</p>
            <p className="mt-1 text-sm text-ink-faint">
              {total} activities in stored order.
            </p>
            <Button className="mt-5" onClick={() => setStep(0)}>
              <RotateCcw size={14} /> Replay
            </Button>
          </div>
        ) : activity ? (
          <>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </p>
            <h3 className="mb-4 text-xl font-semibold text-ink">{activity.title}</h3>

            {activity.type === 'explanation' ? (
              <ExplanationView activity={activity} />
            ) : null}

            {activity.type === 'multiple_choice' ? (
              <>
                <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">
                  {activity.question}
                </p>
                <div className="space-y-2">
                  {activity.options.map((option, index) => {
                    const picked = choice === index
                    const isAnswer = index === activity.answer
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={revealed}
                        onClick={() => {
                          setChoice(index)
                          setRevealed(true)
                        }}
                        className={cn(
                          'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                          revealed && isAnswer
                            ? 'border-success/50 bg-success/10 text-success'
                            : picked
                              ? 'border-danger/50 bg-danger/10 text-danger'
                              : 'border-edge bg-panel-2 text-ink-muted hover:border-accent/40 hover:text-ink',
                        )}
                      >
                        {option || <span className="italic">Empty option</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}

            {activity.type === 'true_false' ? (
              <>
                <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">
                  {activity.statement}
                </p>
                <div className="flex gap-2">
                  {[true, false].map((value) => {
                    const picked = choice === value
                    const isAnswer = value === activity.answer
                    return (
                      <button
                        key={String(value)}
                        type="button"
                        disabled={revealed}
                        onClick={() => {
                          setChoice(value)
                          setRevealed(true)
                        }}
                        className={cn(
                          'flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition',
                          revealed && isAnswer
                            ? 'border-success/50 bg-success/10 text-success'
                            : picked
                              ? 'border-danger/50 bg-danger/10 text-danger'
                              : 'border-edge bg-panel-2 text-ink-muted hover:border-accent/40 hover:text-ink',
                        )}
                      >
                        {value ? 'True' : 'False'}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}

            {activity.type === 'fill_blank' ? (
              <>
                <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">
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
              <p className="mt-4 flex items-start gap-2 text-xs text-ink-faint">
                <Lightbulb size={13} className="mt-0.5 shrink-0 text-boss" />
                {activity.hint}
              </p>
            ) : null}

            {revealed && activity.type !== 'explanation' ? (
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-3 text-sm',
                  answeredCorrectly
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-danger/30 bg-danger/5 text-danger',
                )}
              >
                <p className="font-medium">
                  {answeredCorrectly ? 'Correct' : 'Not quite'}
                  {activity.type === 'fill_blank' && !answeredCorrectly
                    ? ` — expected “${activity.answer}”`
                    : ''}
                </p>
                {activity.explanation ? (
                  <p className="mt-1 text-ink-muted">{activity.explanation}</p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {done ? null : (
        <div className="flex items-center justify-between border-t border-edge px-5 py-3">
          <Button variant="ghost" disabled={step === 0} onClick={goBack}>
            <ArrowLeft size={14} /> Back
          </Button>
          <Button variant="primary" disabled={!canContinue} onClick={goNext}>
            Continue
          </Button>
        </div>
      )}
    </Modal>
  )
}
