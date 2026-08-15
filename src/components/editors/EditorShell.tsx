import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EditorShell({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow: ReactNode
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="mb-6 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
            {eyebrow}
          </p>
          <h1 className="truncate text-2xl font-semibold text-ink">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-6', className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-ink-faint">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
