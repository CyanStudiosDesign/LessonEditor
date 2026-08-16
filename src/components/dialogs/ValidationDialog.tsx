import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import type { ValidationIssue, ValidationReport } from '@/lib/validation'
import { cn, pluralize } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { EmptyState, Modal } from '@/components/ui/Modal'

/** IDE-diagnostic row: thin severity stripe, icon, scope, message. */
function IssueRow({
  issue,
  onNavigate,
}: {
  issue: ValidationIssue
  onNavigate: () => void
}) {
  const isError = issue.severity === 'error'
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg border border-edge border-l-2 bg-panel',
        'px-3 py-2.5 text-left transition-colors duration-150 hover:bg-panel-2',
        isError ? 'border-l-danger' : 'border-l-warning',
      )}
    >
      {isError ? (
        <CircleAlert size={14} className="mt-0.5 shrink-0 text-danger" />
      ) : (
        <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warning" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'chip',
              isError ? 'text-danger' : 'text-warning',
            )}
          >
            {isError ? 'Error' : 'Warning'}
          </span>
          <span className="min-w-0 truncate text-[12px] text-ink-faint">
            {issue.scope}
          </span>
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink">
          {issue.message}
        </span>
      </span>
    </button>
  )
}

export function ValidationDialog({
  open,
  report,
  onClose,
  onExportAnyway,
}: {
  open: boolean
  report: ValidationReport
  onClose: () => void
  /** Offered when only warnings remain. */
  onExportAnyway?: () => void
}) {
  const { dispatch } = useStudio()
  const { issues, errors, warnings } = report

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={issues.length === 0 ? 'Curriculum is valid' : `${pluralize(issues.length, 'issue')} found`}
      subtitle={
        issues.length === 0
          ? undefined
          : [
              errors.length > 0 ? `${errors.length} blocking export` : null,
              warnings.length > 0 ? pluralize(warnings.length, 'warning') : null,
            ]
              .filter(Boolean)
              .join(' · ')
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {onExportAnyway && errors.length === 0 ? (
            <Button variant="primary" onClick={onExportAnyway}>
              Export anyway
            </Button>
          ) : null}
        </>
      }
    >
      {issues.length === 0 ? (
        <EmptyState
          tone="success"
          icon={<CircleCheck size={19} />}
          title="No structural issues found"
          description="Every id, reference and activity checks out."
        />
      ) : (
        <>
          {errors.length > 0 ? (
            <p className="mb-3 text-[12.5px] text-ink-muted">
              Errors must be resolved before the curriculum can be exported. Click an
              issue to jump to it.
            </p>
          ) : (
            <p className="mb-3 text-[12.5px] text-ink-muted">
              Warnings don’t block export. Click an issue to jump to it.
            </p>
          )}
          <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
            {issues.map((issue) => (
              <li key={issue.key}>
                <IssueRow
                  issue={issue}
                  onNavigate={() => {
                    dispatch({ type: 'select', selection: issue.target })
                    onClose()
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
