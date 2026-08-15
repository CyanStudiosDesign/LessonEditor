import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileJson,
  Upload,
} from 'lucide-react'
import type { Curriculum, Lesson } from '@/types/curriculum'
import { ACTIVITY_TYPE_LABELS } from '@/types/curriculum'
import { detectPayload, type DetectedPayload } from '@/lib/schema'
import { countActivities } from '@/lib/validation'
import { pluralize } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

type Parsed =
  | { state: 'empty' }
  | { state: 'error'; message: string; issues: string[] }
  | { state: 'ok'; payload: DetectedPayload }

function summarise(payload: DetectedPayload): string {
  switch (payload.kind) {
    case 'activity':
      return '1 activity detected'
    case 'activities':
      return `${pluralize(payload.data.length, 'activity', 'activities')} detected`
    case 'lesson':
      return '1 lesson detected'
    case 'lessons':
      return `${pluralize(payload.data.length, 'lesson')} detected`
    case 'curriculum':
      return 'Complete curriculum detected'
  }
}

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { curriculum, selection, dispatch } = useStudio()
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setText('')
  }, [open])

  /** The lesson activities land in, and the unit lessons attach to. */
  const targetLessonId =
    selection.kind === 'lesson' || selection.kind === 'activity'
      ? selection.lessonId
      : null
  const targetLesson = curriculum.lessons.find((item) => item.id === targetLessonId)
  const targetUnit =
    selection.kind === 'unit'
      ? curriculum.units.find((unit) => unit.id === selection.unitId)
      : targetLessonId
        ? curriculum.units.find((unit) => unit.lessonIds.includes(targetLessonId))
        : undefined

  const parsed = useMemo<Parsed>(() => {
    const trimmed = text.trim()
    if (!trimmed) return { state: 'empty' }
    let raw: unknown
    try {
      raw = JSON.parse(trimmed)
    } catch (error) {
      return {
        state: 'error',
        message: 'That is not valid JSON.',
        issues: [error instanceof Error ? error.message : String(error)],
      }
    }
    const detection = detectPayload(raw)
    if (!detection.ok) {
      return { state: 'error', message: detection.message, issues: detection.issues }
    }
    return { state: 'ok', payload: detection.payload }
  }, [text])

  const payload = parsed.state === 'ok' ? parsed.payload : null
  const wantsLesson = payload?.kind === 'activity' || payload?.kind === 'activities'
  const blocked = wantsLesson && !targetLesson

  function runImport() {
    if (!payload) return

    switch (payload.kind) {
      case 'activity':
      case 'activities': {
        if (!targetLesson) return
        const activities =
          payload.kind === 'activity' ? [payload.data] : payload.data
        dispatch({ type: 'importActivities', lessonId: targetLesson.id, activities })
        break
      }
      case 'lesson':
      case 'lessons': {
        const lessons: Lesson[] = payload.kind === 'lesson' ? [payload.data] : payload.data
        dispatch({
          type: 'importLessons',
          unitId: targetUnit?.id ?? null,
          lessons,
        })
        break
      }
      case 'curriculum': {
        dispatch({
          type: 'replaceCurriculum',
          curriculum: payload.data as Curriculum,
          selection: { kind: 'chapter' },
        })
        break
      }
    }
    onClose()
  }

  const confirmLabel =
    payload?.kind === 'curriculum' ? 'Import Curriculum' : 'Import'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Import JSON"
      subtitle="Paste an activity, a list of activities, a lesson, a list of lessons, or a complete curriculum."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!payload || blocked} onClick={runImport}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="field-label mb-0">JSON</span>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={13} /> Load file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setText(await file.text())
                event.target.value = ''
              }}
            />
          </div>
          <textarea
            className="field-input field-input-mono h-80 resize-none leading-relaxed"
            placeholder={'{\n  "id": "arrays-04",\n  "type": "multiple_choice",\n  …\n}'}
            spellCheck={false}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <div className="rounded-xl border border-edge bg-panel-2 p-4">
          <h3 className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
            Import Preview
          </h3>

          {parsed.state === 'empty' ? (
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <FileJson size={15} /> Waiting for JSON…
            </p>
          ) : null}

          {parsed.state === 'error' ? (
            <div>
              <p className="flex items-start gap-2 text-sm text-danger">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {parsed.message}
              </p>
              {parsed.issues.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {parsed.issues.map((issue) => (
                    <li key={issue} className="font-mono text-[11px] text-ink-faint">
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {payload ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <CheckCircle2 size={15} className="text-success" />
                {summarise(payload)}
              </p>

              {payload.kind === 'activity' || payload.kind === 'activities' ? (
                <>
                  <ul className="space-y-1">
                    {(payload.kind === 'activity' ? [payload.data] : payload.data).map(
                      (activity) => (
                        <li
                          key={activity.id}
                          className="truncate rounded-md bg-panel px-2 py-1 text-xs text-ink-muted"
                        >
                          <span className="text-ink-faint">
                            {ACTIVITY_TYPE_LABELS[activity.type]} ·{' '}
                          </span>
                          {activity.title}
                        </li>
                      ),
                    )}
                  </ul>
                  <div>
                    <p className="field-label">Target</p>
                    {targetLesson ? (
                      <p className="flex items-center gap-1.5 text-sm text-ink">
                        <ArrowRight size={14} className="text-accent" />
                        {targetLesson.title}
                        <span className="font-mono text-[11px] text-ink-faint">
                          ({targetLesson.id})
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-2 text-sm text-boss">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        Select a lesson in the tree first — activities are stored inside a
                        lesson.
                      </p>
                    )}
                  </div>
                </>
              ) : null}

              {payload.kind === 'lesson' || payload.kind === 'lessons' ? (
                <>
                  <ul className="space-y-1">
                    {(payload.kind === 'lesson' ? [payload.data] : payload.data).map(
                      (lesson) => (
                        <li
                          key={lesson.id}
                          className="truncate rounded-md bg-panel px-2 py-1 text-xs text-ink-muted"
                        >
                          {lesson.icon} {lesson.title}
                          <span className="ml-1 text-ink-faint">
                            ({pluralize(lesson.activities.length, 'activity', 'activities')})
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                  <div>
                    <p className="field-label">Target</p>
                    {targetUnit ? (
                      <p className="flex items-center gap-1.5 text-sm text-ink">
                        <ArrowRight size={14} className="text-accent" />
                        {targetUnit.title}
                        <span className="font-mono text-[11px] text-ink-faint">
                          ({targetUnit.id})
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-ink-muted">
                        No unit selected — the lesson is added to{' '}
                        <code className="font-mono">lessons</code> and listed under
                        “Unassigned lessons”.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-ink-faint">
                      Colliding ids are renamed automatically so no reference breaks.
                    </p>
                  </div>
                </>
              ) : null}

              {payload.kind === 'curriculum' ? (
                <>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="field-label mb-0">Chapter</dt>
                      <dd className="text-ink">{payload.data.chapter.title}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <dt className="field-label mb-0">Units</dt>
                        <dd className="text-lg font-semibold tabular-nums text-ink">
                          {payload.data.units.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="field-label mb-0">Lessons</dt>
                        <dd className="text-lg font-semibold tabular-nums text-ink">
                          {payload.data.lessons.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="field-label mb-0">Activities</dt>
                        <dd className="text-lg font-semibold tabular-nums text-ink">
                          {countActivities(payload.data)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                  <p className="rounded-lg border border-boss/30 bg-boss/10 px-3 py-2 text-xs text-boss">
                    This will replace the current working curriculum.
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
