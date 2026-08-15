import {
  BookOpen,
  Code2,
  Compass,
  Dumbbell,
  FileText,
  Layers,
  ListChecks,
  Pencil,
  Sparkles,
  Swords,
  ToggleLeft,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityType } from '@/types/curriculum'

/** Known `iconKey` values, with a sensible fallback for anything custom. */
export const UNIT_ICON_KEYS = [
  'foundations',
  'coding',
  'book',
  'challenge',
  'practice',
  'explore',
] as const

const UNIT_ICONS: Record<string, LucideIcon> = {
  foundations: Sparkles,
  coding: Code2,
  book: BookOpen,
  challenge: Swords,
  practice: Dumbbell,
  explore: Compass,
}

export function unitIcon(iconKey: string): LucideIcon {
  return UNIT_ICONS[iconKey] ?? Layers
}

export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  explanation: FileText,
  multiple_choice: ListChecks,
  true_false: ToggleLeft,
  fill_blank: Pencil,
}

export const ACTIVITY_ACCENTS: Record<ActivityType, string> = {
  explanation: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
  multiple_choice: 'text-violet-300 bg-violet-400/10 border-violet-400/20',
  true_false: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  fill_blank: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
}
