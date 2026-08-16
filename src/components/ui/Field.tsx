import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { cn, slugify } from '@/lib/utils'

interface FieldProps {
  label: string
  hint?: string
  className?: string
  /** Rendered to the right of the label — e.g. a character count or badge. */
  aside?: ReactNode
  children: (id: string) => ReactNode
}

export function Field({ label, hint, className, aside, children }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {aside ? <span className="mb-1.5 text-[11px] text-ink-faint">{aside}</span> : null}
      </div>
      {children(id)}
      {hint ? <p className="mt-1.5 text-[12px] leading-snug text-ink-faint">{hint}</p> : null}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
  className,
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          className={cn('field-input', mono && 'field-input-mono')}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

interface TextAreaFieldProps extends Omit<TextFieldProps, 'mono'> {
  rows?: number
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
  className,
}: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          className="field-input field-input-area"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  hint?: string
  /** Unit shown inside the field, e.g. "min". */
  suffix?: string
  className?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  hint,
  suffix,
  className,
}: NumberFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <div className="relative">
          <input
            id={id}
            type="number"
            min={min}
            className={cn('field-input tabular-nums', suffix && 'pr-12')}
            value={Number.isFinite(value) ? value : ''}
            onChange={(event) => {
              const next = event.target.valueAsNumber
              onChange(Number.isNaN(next) ? 0 : next)
            }}
          />
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-ink-faint">
              {suffix}
            </span>
          ) : null}
        </div>
      )}
    </Field>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  hint?: string
  className?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  className,
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select
          id={id}
          className="field-input cursor-pointer appearance-none bg-[length:16px] bg-[right_0.65rem_center] bg-no-repeat pr-9"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8f98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

interface IdFieldProps {
  label?: string
  value: string
  onCommit: (value: string) => void
  hint?: string
  className?: string
}

/**
 * Ids are committed on blur / Enter rather than on every keystroke: renaming an
 * id rewrites every reference to it, and half-typed ids should never do that.
 */
export function IdField({
  label = 'ID',
  value,
  onCommit,
  hint,
  className,
}: IdFieldProps) {
  const [draft, setDraft] = useState(value)
  const dirty = draft !== value

  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const next = slugify(draft)
    if (!next) {
      setDraft(value)
      return
    }
    setDraft(next)
    if (next !== value) onCommit(next)
  }

  return (
    <Field
      label={label}
      hint={hint}
      className={className}
      aside={dirty ? 'Enter to apply' : undefined}
    >
      {(id) => (
        <input
          id={id}
          className={cn('field-input field-input-mono', dirty && 'border-accent')}
          value={draft}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              setDraft(value)
              event.currentTarget.blur()
            }
          }}
        />
      )}
    </Field>
  )
}

interface CheckFieldProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckField({
  label,
  description,
  checked,
  onChange,
}: CheckFieldProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5',
        'transition-colors duration-150',
        checked
          ? 'border-accent/30 bg-accent-soft'
          : 'border-edge bg-panel hover:border-edge-strong',
      )}
    >
      <input
        type="checkbox"
        className="mt-px h-3.5 w-3.5 accent-[var(--color-accent)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] text-ink-faint">{description}</span>
        ) : null}
      </span>
    </label>
  )
}
