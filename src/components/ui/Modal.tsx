import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** Not rendered when `bare` is set. */
  title?: ReactNode
  subtitle?: ReactNode
  /** Small leading glyph in the header, e.g. a type icon. */
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Skips the chrome so the dialog can supply its own header. */
  bare?: boolean
  /** Removes body padding — for full-bleed content such as code panes. */
  flush?: boolean
}

const SIZES = {
  sm: 'max-w-[26rem]',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  bare,
  flush,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        className="animate-fade fixed inset-0 cursor-default bg-ink/25 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-pop relative z-10 my-auto w-full overflow-hidden rounded-2xl',
          'border border-edge bg-panel shadow-(--shadow-modal)',
          SIZES[size],
        )}
      >
        {bare ? null : (
          <header className="flex items-start gap-3 px-5 pt-4 pb-3.5">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] leading-tight font-semibold text-ink">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <IconButton label="Close" size="sm" onClick={onClose}>
              <X size={15} />
            </IconButton>
          </header>
        )}
        <div className={cn(bare || flush ? '' : 'px-5 pb-5')}>{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-edge bg-panel-2 px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Shared empty / status block used inside dialogs and editor panes.
 * One icon, one line of copy, an optional action — nothing more.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  tone?: 'neutral' | 'success'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
    >
      <span
        className={cn(
          'mb-3 flex h-10 w-10 items-center justify-center rounded-full border',
          tone === 'success'
            ? 'border-success/20 bg-success-soft text-success'
            : 'border-edge bg-panel-2 text-ink-faint',
        )}
      >
        {icon}
      </span>
      <p className="text-[13.5px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-ink-faint">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
