import type { Curriculum, Selection } from '@/types/curriculum'
import { parseCurriculum } from '@/lib/schema'

const STORAGE_KEY = 'lesson-editor:workspace:v1'

export interface PersistedState {
  curriculum: Curriculum
  selection: Selection
  collapsedUnits: string[]
}

export function persist(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* Quota or private mode — the exported file stays the canonical copy. */
  }
}

export function loadPersisted(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const curriculum = parseCurriculum(parsed.curriculum)
    if (!curriculum.ok) return null
    return {
      curriculum: curriculum.data,
      selection: parsed.selection ?? { kind: 'chapter' },
      collapsedUnits: Array.isArray(parsed.collapsedUnits) ? parsed.collapsedUnits : [],
    }
  } catch {
    return null
  }
}

export function clearPersisted(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
