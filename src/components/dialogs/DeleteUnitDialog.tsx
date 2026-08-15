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
              variant="outline"
              onClick={() => {
                dispatch({ type: 'deleteUnit', unitId: unit.id, deleteLessons: false })
                onClose()
              }}
            >
              Keep lessons
            </Button>
          ) : null}
          <Button
            variant="danger"
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
      <p className="text-sm text-ink-muted">
        {count > 0 ? (
          <>
            <strong className="text-ink">Keep lessons</strong> removes only the unit —
            its lessons stay in the top-level <code className="font-mono">lessons</code>{' '}
            array and appear under “Unassigned lessons”.{' '}
            <strong className="text-ink">Delete unit + lessons</strong> removes both.
          </>
        ) : (
          'The unit will be removed from the units array.'
        )}
      </p>
    </Modal>
  )
}
