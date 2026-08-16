import { TriangleAlert } from 'lucide-react'
import type { Unit } from '@/types/curriculum'
import { pluralize } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/**
 * Deleting a unit is the one place where lesson objects can be orphaned, so the
 * choice is explicit rather than guessed.
 */
export function DeleteUnitDialog({
  unit,
  onClose,
}: {
  unit: Unit | null
  onClose: () => void
}) {
  const { dispatch } = useStudio()
  if (!unit) return null

  const count = unit.lessonIds.length

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Delete “${unit.title}”?`}
      icon={
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <TriangleAlert size={14} />
        </span>
      }
      subtitle={
        count === 0
          ? 'This unit references no lessons.'
          : `This unit references ${pluralize(count, 'lesson')}.`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {count > 0 ? (
            <Button
              onClick={() => {
                dispatch({ type: 'deleteUnit', unitId: unit.id, deleteLessons: false })
                onClose()
              }}
            >
              Keep lessons
            </Button>
          ) : null}
          <Button
            variant="danger-solid"
            onClick={() => {
              dispatch({ type: 'deleteUnit', unitId: unit.id, deleteLessons: true })
              onClose()
            }}
          >
            {count > 0 ? 'Delete unit + lessons' : 'Delete unit'}
          </Button>
        </>
      }
    >
      {count > 0 ? (
        <dl className="space-y-2.5 text-[13px]">
          <div className="rounded-lg border border-edge bg-panel-2 px-3 py-2.5">
            <dt className="font-medium text-ink">Keep lessons</dt>
            <dd className="mt-0.5 leading-snug text-ink-muted">
              Removes only the unit. Its lessons stay in the top-level{' '}
              <code className="font-mono text-[11.5px]">lessons</code> array and appear
              under “Unassigned”.
            </dd>
          </div>
          <div className="rounded-lg border border-edge bg-panel-2 px-3 py-2.5">
            <dt className="font-medium text-ink">Delete unit + lessons</dt>
            <dd className="mt-0.5 leading-snug text-ink-muted">
              Removes the unit and its {pluralize(count, 'lesson')} entirely.
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-[13px] text-ink-muted">
          The unit will be removed from the units array.
        </p>
      )}
    </Modal>
  )
}
