import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { searchCurriculum, type SearchResult } from '@/lib/search'
import { pluralize } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Modal } from '@/components/ui/Modal'

const GROUP_ORDER: SearchResult['group'][] = ['Chapter', 'Unit', 'Lesson', 'Activity']

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { curriculum, dispatch } = useStudio()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(
    () => searchCurriculum(curriculum, query),
    [curriculum, query],
  )

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      items: results.filter((result) => result.group === group),
    })).filter((entry) => entry.items.length > 0)
  }, [results])

  return (
    <Modal open={open} onClose={onClose} size="md" bare>
      <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
        <Search size={16} className="shrink-0 text-ink-faint" />
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          placeholder="Search chapter, units, lessons, activities, questions…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) {
              dispatch({ type: 'select', selection: results[0].target })
              onClose()
            }
          }}
        />
        <kbd className="rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
          esc
        </kbd>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
        {query.trim().length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-faint">
            Type to search across the whole curriculum.
          </p>
        ) : results.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-faint">
            No matches for “{query}”.
          </p>
        ) : (
          <>
            <p className="px-3 pt-1 pb-2 text-[11px] text-ink-faint">
              {pluralize(results.length, 'result')}
            </p>
            {grouped.map(({ group, items }) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                  {group}
                </p>
                {items.map((result) => (
                  <button
                    key={result.key}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'select', selection: result.target })
                      onClose()
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition hover:bg-panel-2"
                  >
                    <span className="w-full truncate text-sm text-ink">
                      {result.title}
                    </span>
                    <span className="w-full truncate text-xs text-ink-faint">
                      {result.context}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
}
