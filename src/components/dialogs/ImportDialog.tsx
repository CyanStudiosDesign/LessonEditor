import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Braces,
  CircleCheck,
  CornerDownRight,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import type { Curriculum, Lesson } from '@/types/curriculum'
import { ACTIVITY_TYPE_LABELS } from '@/types/curriculum'
import { detectPayload, type DetectedPayload } from '@/lib/schema'
import { countActivities } from '@/lib/validation'
import { cn, pluralize } from '@/lib/utils'
import { ACTIVITY_ICONS } from '@/lib/icons'
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

function PreviewLabel({ children }: { children: string }) {
  return <p className="field-eyebrow mb-1.5">{children}</p>
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
  const [dropping, setDropping] = useState(false)
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
        const activities = payload.kind === 'activity' ? [payload.data] : payload.data
        dispatch({ type: 'importActivities', lessonId: targetLesson.id, activities })
        break
      }
      case 'lesson':
      case 'lessons': {
        const lessons: Lesson[] = payload.kind === 'lesson' ? [payload.data] : payload.data
        dispatch({ type: 'importLessons', unitId: targetUnit?.id ?? null, lessons })
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Import JSON"
      subtitle="Paste an activity, a list of activities, a lesson, a list of lessons, or a complete curriculum."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!payload || blocked} onClick={runImport}>
            {payload?.kind === 'curriculum' ? 'Import Curriculum' : 'Import'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Code panel — a dark editor surface inside the light app. */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <PreviewLabel>JSON</PreviewLabel>
            <button
              type="button"
              className="btn-ghost -mt-1.5 h-7 px-2 text-[12.5px]"
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

          <div
            className={cn(
              'overflow-hidden rounded-xl border transition-colors duration-150',
              dropping
                ? 'border-accent'
                : parsed.state === 'error'
                  ? 'border-danger/40'
                  : 'border-edge',
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setDropping(true)
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={async (event) => {
              event.preventDefault()
              setDropping(false)
              const file = event.dataTransfer.files?.[0]
              if (file) setText(await file.text())
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-white/8 bg-[#1c1f26] px-3 py-1.5">
              <Braces size={12} className="text-white/40" />
              <span className="font-mono text-[11px] text-white/45">
                {dropping ? 'drop to load file' : 'paste or drop JSON'}
              </span>
            </div>
            <textarea
              className="h-[19rem] w-full resize-none bg-[#16181d] px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-[#e2e4e9] caret-white placeholder:text-white/25 focus:outline-none"
              placeholder={'{\n  "id": "arrays-04",\n  "type": "multiple_choice",\n  …\n}'}
              spellCheck={false}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        </div>

        {/* Detection preview */}
        <div className="min-w-0 rounded-xl border border-edge bg-panel-2 p-4">
          <PreviewLabel>Import Preview</PreviewLabel>

          {parsed.state === 'empty' ? (
            <p className="mt-3 text-[13px] text-ink-faint">
              The type is detected automatically as you paste.
            </p>
          ) : null}

          {parsed.state === 'error' ? (
            <div className="mt-3 rounded-lg border-l-2 border-l-danger bg-danger-soft px-3 py-2.5">
              <p className="flex items-start gap-2 text-[13px] font-medium text-danger">
                <TriangleAlert size={14} className="mt-px shrink-0" />
                {parsed.message}
              </p>
              {parsed.issues.length > 0 ? (
                <ul className="mt-1.5 space-y-1 pl-6">
                  {parsed.issues.map((issue) => (
                    <li key={issue} className="font-mono text-[11.5px] text-ink-muted">
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {payload ? (
            <div className="mt-3 space-y-4">
              <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                <CircleCheck size={15} className="shrink-0 text-success" />
                {summarise(payload)}
              </p>

              {payload.kind === 'activity' || payload.kind === 'activities' ? (
                <>
                  <ul className="space-y-1">
                    {(payload.kind === 'activity' ? [payload.data] : payload.data).map(
                      (activity) => {
                        const Icon =
                          ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.explanation
                        return (
                          <li
                            key={activity.id}
                            className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-2.5 py-1.5"
                          >
                            <Icon size={13} className="shrink-0 text-ink-faint" />
                            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                              {activity.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-ink-faint">
                              {ACTIVITY_TYPE_LABELS[activity.type]}
                            </span>
                          </li>
                        )
                      },
                    )}
                  </ul>
                  <div>
                    <PreviewLabel>Target</PreviewLabel>
                    {targetLesson ? (
                      <p className="flex items-center gap-1.5 text-[13px] text-ink">
                        <ArrowRight size={13} className="shrink-0 text-accent" />
                        {targetLesson.title}
                        <span className="id-tag">{targetLesson.id}</span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-2 rounded-lg border-l-2 border-l-warning bg-warning-soft px-3 py-2 text-[12.5px] text-warning">
                        <TriangleAlert size={13} className="mt-px shrink-0" />
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
                          className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-2.5 py-1.5"
                        >
                          <span className="shrink-0 text-[13px]">{lesson.icon}</span>
                          <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-faint">
                            {lesson.activities.length}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                  <div>
                    <PreviewLabel>Target</PreviewLabel>
                    {targetUnit ? (
                      <p className="flex items-center gap-1.5 text-[13px] text-ink">
                        <ArrowRight size={13} className="shrink-0 text-accent" />
                        {targetUnit.title}
                        <span className="id-tag">{targetUnit.id}</span>
                      </p>
                    ) : (
                      <p className="text-[12.5px] leading-relaxed text-ink-muted">
                        No unit selected — added to{' '}
                        <code className="font-mono text-[11.5px]">lessons</code> and listed
                        under “Unassigned”.
                      </p>
                    )}
                    <p className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-faint">
                      <CornerDownRight size={12} className="mt-0.5 shrink-0" />
                      Colliding ids are renamed automatically so no reference breaks.
                    </p>
                  </div>
                </>
              ) : null}

              {payload.kind === 'curriculum' ? (
                <>
                  <div>
                    <PreviewLabel>Chapter</PreviewLabel>
                    <p className="text-[13.5px] font-medium text-ink">
                      {payload.data.chapter.title}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Units', value: payload.data.units.length },
                      { label: 'Lessons', value: payload.data.lessons.length },
                      { label: 'Activities', value: countActivities(payload.data) },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-edge bg-panel px-2.5 py-2"
                      >
                        <p className="text-[18px] leading-none font-semibold tabular-nums text-ink">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-[11px] text-ink-faint">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="rounded-lg border-l-2 border-l-warning bg-warning-soft px-3 py-2 text-[12.5px] text-warning">
                    This replaces the current working curriculum.
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
