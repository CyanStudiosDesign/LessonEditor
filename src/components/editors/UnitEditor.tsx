import { useMemo, useState } from 'react'
import { Copy, Link2, Plus, Trash2, Unlink } from 'lucide-react'
import type { Unit } from '@/types/curriculum'
import { useLessonMap, useStudio } from '@/state/store'
import { UNIT_ICON_KEYS, unitIcon } from '@/lib/icons'
import { CheckField, Field, IdField, TextField } from '@/components/ui/Field'
import { Button, IconButton } from '@/components/ui/Button'
import { EditorShell, Section } from '@/components/editors/EditorShell'
import { DeleteUnitDialog } from '@/components/dialogs/DeleteUnitDialog'

export function UnitEditor({ unit }: { unit: Unit }) {
  const { curriculum, dispatch } = useStudio()
  const lessonMap = useLessonMap()
  const [pendingDelete, setPendingDelete] = useState<Unit | null>(null)
  const [attachId, setAttachId] = useState('')

  const attachable = useMemo(() => {
    const referenced = new Set(curriculum.units.flatMap((item) => item.lessonIds))
    return curriculum.lessons.filter((lesson) => !referenced.has(lesson.id))
  }, [curriculum])

  const Icon = unitIcon(unit.iconKey)

  return (
    <EditorShell
      eyebrow="Unit"
      title={
        <span className="flex items-center gap-2">
          <Icon size={20} className={unit.isBoss ? 'text-boss' : 'text-accent'} />
          {unit.title || 'Untitled unit'}
        </span>
      }
      actions={
        <>
          <Button onClick={() => dispatch({ type: 'duplicateUnit', unitId: unit.id })}>
            <Copy size={14} /> Duplicate
          </Button>
          <Button variant="danger" onClick={() => setPendingDelete(unit)}>
            <Trash2 size={14} /> Delete
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <IdField
          value={unit.id}
          onCommit={(id) => dispatch({ type: 'updateUnit', unitId: unit.id, patch: { id } })}
          hint="Made unique automatically if it collides."
        />
        <TextField
          label="Title"
          value={unit.title}
          onChange={(title) =>
            dispatch({ type: 'updateUnit', unitId: unit.id, patch: { title } })
          }
        />
        <Field
          label="Icon key"
          hint="Free text — the consuming app maps this to its own icon set."
        >
          {(id) => (
            <div className="flex gap-2">
              <input
                id={id}
                className="field-input field-input-mono"
                value={unit.iconKey}
                onChange={(event) =>
                  dispatch({
                    type: 'updateUnit',
                    unitId: unit.id,
                    patch: { iconKey: event.target.value },
                  })
                }
              />
              <select
                aria-label="Preset icon keys"
                className="field-input w-32 shrink-0"
                value={UNIT_ICON_KEYS.includes(unit.iconKey as never) ? unit.iconKey : ''}
                onChange={(event) =>
                  dispatch({
                    type: 'updateUnit',
                    unitId: unit.id,
                    patch: { iconKey: event.target.value },
                  })
                }
              >
                <option value="">Preset…</option>
                {UNIT_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Field>
        <div className="flex items-end">
          <CheckField
            label="Boss unit"
            description="Adds isBoss: true to this unit."
            checked={unit.isBoss === true}
            onChange={(isBoss) =>
              dispatch({
                type: 'updateUnit',
                unitId: unit.id,
                patch: { isBoss: isBoss ? true : undefined },
              })
            }
          />
        </div>
      </div>

      <Section
        title="lessonIds"
        description="References only — the lesson objects live in the top-level lessons array. Drag in the tree to reorder."
        actions={
          <Button onClick={() => dispatch({ type: 'addLesson', unitId: unit.id })}>
            <Plus size={14} /> Add lesson
          </Button>
        }
      >
        <div className="card divide-y divide-edge">
          {unit.lessonIds.map((lessonId, index) => {
            const lesson = lessonMap.get(lessonId)
            return (
              <div key={lessonId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-center text-xs tabular-nums text-ink-faint">
                  {index + 1}
                </span>
                <button
                  type="button"
                  disabled={!lesson}
                  onClick={() =>
                    dispatch({ type: 'select', selection: { kind: 'lesson', lessonId } })
                  }
                  className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                >
                  <span className="w-5 text-center">{lesson?.icon || '⚠️'}</span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        lesson
                          ? 'block truncate text-sm text-ink'
                          : 'block truncate text-sm text-danger'
                      }
                    >
                      {lesson ? lesson.title : 'Missing lesson'}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-ink-faint">
                      {lessonId}
                    </span>
                  </span>
                </button>
                <IconButton
                  label="Remove reference"
                  onClick={() =>
                    dispatch({ type: 'detachLesson', lessonId, unitId: unit.id })
                  }
                >
                  <Unlink size={13} />
                </IconButton>
              </div>
            )
          })}
          {unit.lessonIds.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">
              This unit references no lessons.
            </p>
          ) : null}
        </div>

        {attachable.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <select
              aria-label="Unassigned lesson"
              className="field-input flex-1"
              value={attachId}
              onChange={(event) => setAttachId(event.target.value)}
            >
              <option value="">Attach an unassigned lesson…</option>
              {attachable.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} ({lesson.id})
                </option>
              ))}
            </select>
            <Button
              disabled={!attachId}
              onClick={() => {
                dispatch({ type: 'attachLesson', lessonId: attachId, unitId: unit.id })
                setAttachId('')
              }}
            >
              <Link2 size={14} /> Attach
            </Button>
          </div>
        ) : null}
      </Section>

      <DeleteUnitDialog unit={pendingDelete} onClose={() => setPendingDelete(null)} />
    </EditorShell>
  )
}
