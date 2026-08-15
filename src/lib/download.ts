import type { Curriculum } from '@/types/curriculum'
import { toJson } from '@/lib/schema'
import { slugify } from '@/lib/utils'

export function exportFileName(curriculum: Curriculum): string {
  return `${slugify(curriculum.chapter.id) || 'curriculum'}.json`
}

/**
 * Writes exactly one file: { chapter, units, lessons }, 2-space indented.
 */
export function downloadCurriculum(curriculum: Curriculum): void {
  const blob = new Blob([toJson(curriculum)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = exportFileName(curriculum)
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
