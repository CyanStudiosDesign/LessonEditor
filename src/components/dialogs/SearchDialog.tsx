import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Search, SearchX } from 'lucide-react'
import { searchCurriculum, type SearchResult } from '@/lib/search'
import { cn, pluralize } from '@/lib/utils'
import {
  ACTIVITY_ICONS,
  ACTIVITY_INK,
  CHAPTER_ICON,
  LESSON_ICON,
  UNIT_ICON,
} from '@/lib/icons'
import { useStudio } from '@/state/store'
import { EmptyState, Modal } from '@/components/ui/Modal'

const GROUP_ORDER: SearchResult['group'][] = ['Chapter', 'Unit', 'Lesson', 'Activity']

const GROUP_ICONS = {
  Chapter: CHAPTER_ICON,
  Unit: UNIT_ICON,
  Lesson: LESSON_ICON,
  Activity: Search,
} as const

const GROUP_INK = {
  Chapter: 'text-chapter',
  Unit: 'text-unit',
  Lesson: 'text-ink-faint',
  Activity: 'text-ink-faint',
} as const

/** Results carry their own glyph: activity type icon, lesson emoji, or group icon. */
function ResultGlyph({
  result,
  fallback: Fallback,
  group,
}: {
  result: SearchResult
  fallback: (props: { size?: number; className?: string }) => ReactNode
  group: SearchResult['group']
}) {
  if (result.activityType) {
    const Icon = ACTIVITY_ICONS[result.activityType]
    return (
      <Icon size={14} className={cn('shrink-0', ACTIVITY_INK[result.activityType])} />
    )
  }
  if (result.emoji) {
    return (
      <span className="w-[14px] shrink-0 text-center text-[13px] leading-none">
        {result.emoji}
      </span>
    )
  }
  return <Fallback size={14} className={cn('shrink-0', GROUP_INK[group])} />
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { curriculum, dispatch } = useStudio()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(
    () => searchCurriculum(curriculum, query),
    [curriculum, query],
  )

  useEffect(() => setActive(0), [query])

  /** Keeps the highlighted row inside the scroll viewport. */
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const grouped = useMemo(() => {
    let cursor = 0
    return GROUP_ORDER.map((group) => {
      const items = results
        .filter((result) => result.group === group)
        .map((result) => ({ result, index: cursor++ }))
      return { group, items }
    }).filter((entry) => entry.items.length > 0)
  }, [results])

  const choose = (result: SearchResult) => {
    dispatch({ type: 'select', selection: result.target })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="md" bare>
      <div className="flex h-11 items-center gap-2.5 border-b border-edge px-3.5">
        <Search size={15} className="shrink-0 text-ink-faint" />
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none"
          placeholder="Search chapter, units, lessons, activities, questions…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((index) => Math.min(index + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((index) => Math.max(index - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              const result = results[active]
              if (result) choose(result)
            }
          }}
        />
        <kbd className="rounded border border-edge bg-panel-2 px-1.5 py-px font-sans text-[10.5px] text-ink-faint">
          esc
        </kbd>
      </div>

      <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-1.5">
        {query.trim().length === 0 ? (
          <p className="px-3 py-8 text-center text-[13px] text-ink-faint">
            Search titles, questions, options and content.
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX size={17} />}
            title={`No matches for “${query}”`}
            description="Try a shorter term, or search by id."
          />
        ) : (
          grouped.map(({ group, items }) => {
            const Icon = GROUP_ICONS[group]
            return (
              <div key={group} className="mb-1 last:mb-0">
                <p className="field-eyebrow px-2.5 py-1.5">{group}</p>
                {items.map(({ result, index }) => (
                  <button
                    key={result.key}
                    type="button"
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(result)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left',
                      'transition-colors duration-150',
                      index === active ? 'bg-accent-soft' : 'hover:bg-edge-soft',
                    )}
                  >
                    <ResultGlyph result={result} fallback={Icon} group={group} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">
                        {result.title}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-faint">
                        {result.context}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )
          })
        )}
      </div>

      {results.length > 0 ? (
        <div className="flex items-center justify-between border-t border-edge bg-panel-2 px-3.5 py-2 text-[11.5px] text-ink-faint">
          <span>{pluralize(results.length, 'result')}</span>
          <span className="flex items-center gap-2.5">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
          </span>
        </div>
      ) : null}
    </Modal>
  )
}
