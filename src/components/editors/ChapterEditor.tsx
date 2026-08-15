import { ListOrdered } from 'lucide-react'
import { useStudio } from '@/state/store'
import { countActivities } from '@/lib/validation'
import { IdField, NumberField, TextAreaField, TextField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { EditorShell, Section } from '@/components/editors/EditorShell'
import { unitIcon } from '@/lib/icons'
import { pluralize } from '@/lib/utils'

export function ChapterEditor() {
  const { curriculum, dispatch } = useStudio()
  const { chapter, units, lessons } = curriculum

  const stats = [
    { label: 'Units', value: units.length },
    { label: 'Lessons', value: lessons.length },
    { label: 'Activities', value: countActivities(curriculum) },
    {
      label: 'Minutes',
      value: lessons.reduce(
        (total, lesson) =>
          total + (Number.isFinite(lesson.estimatedMinutes) ? lesson.estimatedMinutes : 0),
        0,
      ),
    },
  ]

  return (
    <EditorShell eyebrow="Chapter" title={chapter.title || 'Untitled chapter'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <IdField
          value={chapter.id}
          onCommit={(id) => dispatch({ type: 'updateChapter', patch: { id } })}
          hint="Used for the export filename."
        />
        <NumberField
          label="Number"
          value={chapter.number}
          onChange={(number) => dispatch({ type: 'updateChapter', patch: { number } })}
        />
        <TextField
          className="sm:col-span-2"
          label="Title"
          value={chapter.title}
          onChange={(title) => dispatch({ type: 'updateChapter', patch: { title } })}
        />
        <TextAreaField
          className="sm:col-span-2"
          label="Description"
          rows={3}
          value={chapter.description}
          onChange={(description) =>
            dispatch({ type: 'updateChapter', patch: { description } })
          }
        />
      </div>

      <Section title="At a glance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card px-3 py-3">
              <p className="text-2xl font-semibold tabular-nums text-ink">{stat.value}</p>
              <p className="text-[11px] tracking-wide text-ink-faint uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Units"
        description="Drag units in the tree to change their order in the exported array."
        actions={
          <Button onClick={() => dispatch({ type: 'renumberLessonOrder' })}>
            <ListOrdered size={14} /> Renumber lesson order
          </Button>
        }
      >
        <div className="card divide-y divide-edge">
          {units.map((unit, index) => {
            const Icon = unitIcon(unit.iconKey)
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() =>
                  dispatch({ type: 'select', selection: { kind: 'unit', unitId: unit.id } })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition first:rounded-t-xl last:rounded-b-xl hover:bg-panel-2"
              >
                <span className="w-5 text-center text-xs tabular-nums text-ink-faint">
                  {index + 1}
                </span>
                <Icon size={15} className={unit.isBoss ? 'text-boss' : 'text-accent'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{unit.title}</span>
                  <span className="block truncate font-mono text-[11px] text-ink-faint">
                    {unit.id}
                  </span>
                </span>
                <span className="text-xs text-ink-faint">
                  {pluralize(unit.lessonIds.length, 'lesson')}
                </span>
              </button>
            )
          })}
          {units.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">No units yet.</p>
          ) : null}
        </div>
      </Section>
    </EditorShell>
  )
}
