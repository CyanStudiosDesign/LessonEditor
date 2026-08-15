import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Kebab-case slug suitable for use as an id. */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug
}

/**
 * Returns `base` if free, otherwise appends -2, -3, … until unique.
 * Never returns an empty string.
 */
export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const root = base && base.length > 0 ? base : 'item'
  if (!used.has(root)) return root
  let n = 2
  while (used.has(`${root}-${n}`)) n += 1
  return `${root}-${n}`
}

export function deepClone<T>(value: T): T {
  return structuredClone(value)
}

/** Immutably move an item inside an array. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}
