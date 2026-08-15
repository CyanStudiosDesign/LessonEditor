import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

export function Button({
  variant = 'outline',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(VARIANTS[variant], className)} {...props} />
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition',
        'hover:bg-edge-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}
