import {
  BookOpen,
  BookOpenText,
  CircleCheckBig,
  Code2,
  Compass,
  Crown,
  Dumbbell,
  FileText,
  Layers,
  ListChecks,
  Milestone,
  Swords,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityType } from '@/types/curriculum'

/* ------------------------------------------------------------------ *
 * Entity icons — one glyph per level of the hierarchy, used everywhere
 * so the tree, the editors and the dialogs speak the same language.
 * ------------------------------------------------------------------ */

export const CHAPTER_ICON: LucideIcon = BookOpen
export const UNIT_ICON: LucideIcon = Layers
export const LESSON_ICON: LucideIcon = FileText
export const BOSS_ICON: LucideIcon = Crown

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
  foundations: Milestone,
  coding: Code2,
  book: BookOpen,
  challenge: Swords,
  practice: Dumbbell,
  explore: Compass,
}

export function unitIcon(iconKey: string): LucideIcon {
  return UNIT_ICONS[iconKey] ?? UNIT_ICON
}

/* ------------------------------------------------------------------ *
 * Activity types — the single source of truth for their icon and colour.
 * Muted, semantic, light-theme tints; never full-panel colour.
 * ------------------------------------------------------------------ */

export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  explanation: BookOpenText,
  multiple_choice: ListChecks,
  true_false: CircleCheckBig,
  fill_blank: TextCursorInput,
}

/** Badge treatment: soft tint + hairline border + saturated glyph. */
export const ACTIVITY_ACCENTS: Record<ActivityType, string> = {
  explanation:
    'text-act-explanation bg-act-explanation-soft border-act-explanation/15',
  multiple_choice: 'text-act-choice bg-act-choice-soft border-act-choice/15',
  true_false: 'text-act-truefalse bg-act-truefalse-soft border-act-truefalse/15',
  fill_blank: 'text-act-fillblank bg-act-fillblank-soft border-act-fillblank/15',
}

/** Just the foreground colour, for thin stripes and bare glyphs. */
export const ACTIVITY_INK: Record<ActivityType, string> = {
  explanation: 'text-act-explanation',
  multiple_choice: 'text-act-choice',
  true_false: 'text-act-truefalse',
  fill_blank: 'text-act-fillblank',
}
