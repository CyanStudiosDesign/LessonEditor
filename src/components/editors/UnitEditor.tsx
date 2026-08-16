import { useMemo, useState } from 'react'
import { Copy, Link2, Plus, Trash2, TriangleAlert, Unlink } from 'lucide-react'
import type { Unit } from '@/types/curriculum'
import { useLessonMap, useStudio } from '@/state/store'
import { BOSS_ICON, LESSON_ICON, UNIT_ICON_KEYS, unitIcon } from '@/lib/icons'
import { CheckField, Field, IdField, TextField } from '@/components/ui/Field'
import { Button, IconButton } from '@/components/ui/Button'
import {
  EditorShell,
  MenuItem,
  MetaDot,
  MetaItem,
  OverflowMenu,
  Section,
} from '@/components/editors/EditorShell'
import { DeleteUnitDialog } from '@/components/dialogs/DeleteUnitDialog'
import { cn, pluralize } from '@/lib/utils'

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
  const position = curriculum.units.findIndex((item) => item.id === unit.id) + 1

  return (
    <EditorShell
      eyebrow="Unit"
      icon={
        <Icon
          size={19}
          className={cn('shrink-0', unit.isBoss ? 'text-boss' : 'text-unit')}
        />
      }
      title={unit.title || 'Untitled unit'}
      meta={
        <>
          <MetaItem>
            <span className="id-tag">{unit.id}</span>
          </MetaItem>
          <MetaDot />
          <MetaItem>Position {position}</MetaItem>
          <MetaDot />
          <MetaItem>{pluralize(unit.lessonIds.length, 'lesson')}</MetaItem>
          {unit.isBoss ? (
            <>
              <MetaDot />
              <MetaItem icon={<BOSS_ICON size={12} className="text-boss" />}>
                <span className="text-boss">Boss unit</span>
              </MetaItem>
            </>
          ) : null}
        </>
      }
      actions={
        <>
          <Button onClick={() => dispatch({ type: 'duplicateUnit', unitId: unit.id })}>
            <Copy size={14} /> Duplicate
          </Button>
          <OverflowMenu>
            {(close) => (
              <MenuItem
                icon={<Trash2 size={14} />}
                tone="danger"
                onClick={() => {
                  close()
                  setPendingDelete(unit)
                }}
              >
                Delete unit
              </MenuItem>
            )}
          </OverflowMenu>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Title"
          value={unit.title}
          onChange={(title) =>
            dispatch({ type: 'updateUnit', unitId: unit.id, patch: { title } })
          }
        />
        <IdField
          value={unit.id}
          onCommit={(id) => dispatch({ type: 'updateUnit', unitId: unit.id, patch: { id } })}
          hint="Made unique automatically if it collides."
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
                className="field-input w-28 shrink-0 cursor-pointer"
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
        <div className="flex items-end pb-px">
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
        title="Lessons"
        description="References only — lesson objects live in the top-level lessons array. Drag in the tree to reorder."
        actions={
          <Button onClick={() => dispatch({ type: 'addLesson', unitId: unit.id })}>
            <Plus size={14} /> Add lesson
          </Button>
        }
      >
        <div className="card divide-y divide-edge-soft overflow-hidden">
          {unit.lessonIds.map((lessonId, index) => {
            const lesson = lessonMap.get(lessonId)
            return (
              <div
                key={lessonId}
                className="group flex items-center gap-3 px-3.5 py-2 transition-colors duration-150 hover:bg-panel-2"
              >
                <span className="w-4 shrink-0 text-center text-[11.5px] tabular-nums text-ink-faint">
                  {index + 1}
                </span>
                <button
                  type="button"
                  disabled={!lesson}
                  onClick={() =>
                    dispatch({ type: 'select', selection: { kind: 'lesson', lessonId } })
                  }
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-default"
                >
                  {!lesson ? (
                    <TriangleAlert size={14} className="shrink-0 text-danger" />
                  ) : lesson.isBoss ? (
                    <BOSS_ICON size={14} className="shrink-0 text-boss" />
                  ) : lesson.icon ? (
                    <span className="w-3.5 shrink-0 text-center text-[13px] leading-none">
                      {lesson.icon}
                    </span>
                  ) : (
                    <LESSON_ICON size={14} className="shrink-0 text-ink-faint" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[13.5px]',
                        lesson ? 'text-ink' : 'font-medium text-danger',
                      )}
                    >
                      {lesson ? lesson.title : 'Missing lesson'}
                    </span>
                    <span className="block truncate font-mono text-[11.5px] text-ink-faint">
                      {lessonId}
                    </span>
                  </span>
                  {lesson ? (
                    <span className="shrink-0 text-[12px] text-ink-faint">
                      {pluralize(lesson.activities.length, 'activity', 'activities')}
                    </span>
                  ) : null}
                </button>
                <IconButton
                  label="Remove reference"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    dispatch({ type: 'detachLesson', lessonId, unitId: unit.id })
                  }
                >
                  <Unlink size={12} />
                </IconButton>
              </div>
            )
          })}
          {unit.lessonIds.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-ink-faint">
              This unit references no lessons.
            </p>
          ) : null}
        </div>

        {attachable.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <select
              aria-label="Unassigned lesson"
              className="field-input flex-1 cursor-pointer"
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
