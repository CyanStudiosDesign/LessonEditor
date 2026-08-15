import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { cn, slugify } from '@/lib/utils'

interface FieldProps {
  label: string
  hint?: string
  className?: string
  children: (id: string) => ReactNode
}

export function Field({ label, hint, className, children }: FieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
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
          className="field-input resize-y leading-relaxed"
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
  className?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  hint,
  className,
}: NumberFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          type="number"
          min={min}
          className="field-input"
          value={Number.isFinite(value) ? value : ''}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            onChange(Number.isNaN(next) ? 0 : next)
          }}
        />
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
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          className="field-input field-input-mono"
          value={draft}
          spellCheck={false}
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
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-edge bg-panel-2 px-3 py-2.5">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {description ? (
          <span className="block text-xs text-ink-faint">{description}</span>
        ) : null}
      </span>
    </label>
  )
}
