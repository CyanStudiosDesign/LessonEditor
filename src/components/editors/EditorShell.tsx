import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/Button'

/**
 * The structural primitive every editor screen is built from, so Chapter,
 * Unit and Lesson share one spacing rhythm, one header anatomy and one
 * content width.
 */
export function EditorShell({
  eyebrow,
  icon,
  title,
  meta,
  actions,
  children,
}: {
  eyebrow: ReactNode
  /** Small glyph shown beside the title. */
  icon?: ReactNode
  title: ReactNode
  /** Secondary line under the title — ids, counts, durations. */
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[980px] px-7 pt-6 pb-16">
      <header className="mb-7 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="field-eyebrow mb-1.5">{eyebrow}</p>
          <h1 className="flex min-w-0 items-center gap-2 text-[22px] leading-tight font-semibold tracking-[-0.015em] text-ink">
            {icon}
            <span className="min-w-0 truncate">{title}</span>
          </h1>
          {meta ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-faint">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5 pt-1">{actions}</div>
        ) : null}
      </header>
      {children}
    </div>
  )
}

/**
 * A titled block inside an editor. Whitespace and a small heading do the
 * grouping — no nested cards around individual fields.
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  divided = true,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Hairline rule above the section heading. */
  divided?: boolean
}) {
  return (
    <section className={cn(divided && 'rule mt-7 pt-6', !divided && 'mt-7', className)}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink-faint">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Metadata pill for the editor header meta row. */
export function MetaItem({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {children}
    </span>
  )
}

export function MetaDot() {
  return <span aria-hidden>·</span>
}

/**
 * Overflow menu keeping destructive actions out of the primary row while
 * staying discoverable and keyboard reachable.
 */
export function OverflowMenu({
  label = 'More actions',
  children,
}: {
  label?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn('h-8 w-8 border border-edge bg-panel', open && 'bg-panel-2')}
        onClick={() => setOpen((value) => !value)}
      >
        <Ellipsis size={15} />
      </IconButton>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="animate-pop absolute right-0 z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-edge bg-panel p-1 shadow-(--shadow-pop)"
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function MenuItem({
  icon,
  children,
  onClick,
  tone = 'default',
}: {
  icon?: ReactNode
  children: ReactNode
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px]',
        'transition-colors duration-150',
        tone === 'danger'
          ? 'text-danger hover:bg-danger-soft'
          : 'text-ink-muted hover:bg-edge-soft hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
