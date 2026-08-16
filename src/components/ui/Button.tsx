import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'danger-solid'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-solid': 'btn-danger-solid',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2 text-[12.5px]',
  md: '',
}

export function Button({
  variant = 'outline',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Doubles as the tooltip — icon-only controls must always be nameable. */
  label: string
  size?: Size
  tone?: 'default' | 'danger'
}

export function IconButton({
  label,
  className,
  size = 'md',
  tone = 'default',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-ink-faint',
        'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-6 w-6' : 'h-7 w-7',
        tone === 'danger'
          ? 'hover:bg-danger-soft hover:text-danger'
          : 'hover:bg-edge-soft hover:text-ink',
        className,
      )}
      {...props}
    />
  )
}

export function Separator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('mx-1 h-5 w-px shrink-0 bg-edge', className)}
    />
  )
}
