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
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  bare?: boolean
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  bare,
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
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-pop relative z-10 my-auto w-full overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/50',
          SIZES[size],
        )}
      >
        {bare ? null : (
          <header className="flex items-start gap-3 border-b border-edge px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
              ) : null}
            </div>
            <IconButton label="Close" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </header>
        )}
        <div className={cn(bare ? '' : 'px-5 py-4')}>{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-edge bg-panel-2/60 px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
