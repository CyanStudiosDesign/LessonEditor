import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Double-click-to-rename used by the tree rows. Commits on Enter or blur,
 * reverts on Escape.
 */
export function InlineRename({
  value,
  onCommit,
  onCancel,
  className,
}: {
  value: string
  onCommit: (next: string) => void
  onCancel: () => void
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const commit = () => {
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
    else onCancel()
  }

  return (
    <input
      ref={ref}
      value={draft}
      spellCheck={false}
      aria-label="Rename"
      className={cn(
        'min-w-0 flex-1 rounded border border-accent bg-panel px-1.5 py-0.5 text-[13px] text-ink',
        'ring-[3px] ring-accent-ring/50 outline-none',
        className,
      )}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
    />
  )
}
