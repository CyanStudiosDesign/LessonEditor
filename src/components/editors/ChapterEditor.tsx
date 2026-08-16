import { ChevronRight, Clock, ListOrdered } from 'lucide-react'
import { useStudio } from '@/state/store'
import { countActivities } from '@/lib/validation'
import { IdField, NumberField, TextAreaField, TextField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { EditorShell, MetaDot, MetaItem, Section } from '@/components/editors/EditorShell'
import { CHAPTER_ICON, unitIcon } from '@/lib/icons'
import { cn, pluralize } from '@/lib/utils'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-3.5 py-3">
      <p className="text-[22px] leading-none font-semibold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] text-ink-faint">{label}</p>
    </div>
  )
}

export function ChapterEditor() {
  const { curriculum, dispatch } = useStudio()
  const { chapter, units, lessons } = curriculum

  const totalMinutes = lessons.reduce(
    (total, lesson) =>
      total + (Number.isFinite(lesson.estimatedMinutes) ? lesson.estimatedMinutes : 0),
    0,
  )

  return (
    <EditorShell
      eyebrow="Chapter"
      icon={<CHAPTER_ICON size={19} className="shrink-0 text-chapter" />}
      title={chapter.title || 'Untitled chapter'}
      meta={
        <>
          <MetaItem>
            <span className="id-tag">{chapter.id}</span>
          </MetaItem>
          <MetaDot />
          <MetaItem>Chapter {chapter.number}</MetaItem>
          <MetaDot />
          <MetaItem icon={<Clock size={12} />}>{totalMinutes} min total</MetaItem>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <TextField
          label="Title"
          value={chapter.title}
          onChange={(title) => dispatch({ type: 'updateChapter', patch: { title } })}
        />
        <NumberField
          label="Number"
          value={chapter.number}
          onChange={(number) => dispatch({ type: 'updateChapter', patch: { number } })}
        />
        <TextAreaField
          className="sm:col-span-2"
          label="Description"
          rows={2}
          value={chapter.description}
          onChange={(description) =>
            dispatch({ type: 'updateChapter', patch: { description } })
          }
        />
        <IdField
          className="sm:col-span-2 sm:max-w-xs"
          value={chapter.id}
          onCommit={(id) => dispatch({ type: 'updateChapter', patch: { id } })}
          hint="Used for the export filename."
        />
      </div>

      <Section title="Overview" description="Counted from the current curriculum.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Units" value={units.length} />
          <Stat label="Lessons" value={lessons.length} />
          <Stat label="Activities" value={countActivities(curriculum)} />
          <Stat label="Minutes" value={totalMinutes} />
        </div>
      </Section>

      <Section
        title="Units"
        description="Drag units in the tree to change their order in the exported array."
        actions={
          <Button
            onClick={() => dispatch({ type: 'renumberLessonOrder' })}
            title="Set every lesson's order field to its position in the tree"
          >
            <ListOrdered size={14} /> Renumber order
          </Button>
        }
      >
        <div className="card divide-y divide-edge-soft overflow-hidden">
          {units.map((unit, index) => {
            const Icon = unitIcon(unit.iconKey)
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() =>
                  dispatch({ type: 'select', selection: { kind: 'unit', unitId: unit.id } })
                }
                className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-panel-2"
              >
                <span className="w-4 shrink-0 text-center text-[11.5px] tabular-nums text-ink-faint">
                  {index + 1}
                </span>
                <Icon
                  size={14}
                  className={cn('shrink-0', unit.isBoss ? 'text-boss' : 'text-unit')}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {unit.title}
                  </span>
                  <span className="block truncate font-mono text-[11.5px] text-ink-faint">
                    {unit.id}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-ink-faint">
                  {pluralize(unit.lessonIds.length, 'lesson')}
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                />
              </button>
            )
          })}
          {units.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-ink-faint">
              No units yet.
            </p>
          ) : null}
        </div>
      </Section>
    </EditorShell>
  )
}
