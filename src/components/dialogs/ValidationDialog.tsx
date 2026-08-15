import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import type { ValidationReport } from '@/lib/validation'
import { pluralize } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

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

  const heading =
    issues.length === 0
      ? 'No issues found'
      : `${pluralize(issues.length, 'Issue')} Found`

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={heading}
      subtitle={
        issues.length === 0
          ? 'The curriculum is valid and ready to export.'
          : `${errors.length} blocking · ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
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
        <p className="flex items-center gap-2 py-6 text-sm text-success">
          <CheckCircle2 size={18} /> Every id, reference and activity checks out.
        </p>
      ) : (
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {issues.map((issue) => (
            <li key={issue.key}>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'select', selection: issue.target })
                  onClose()
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-edge bg-panel-2 px-3 py-2.5 text-left transition hover:border-accent/40"
              >
                {issue.severity === 'error' ? (
                  <ShieldAlert size={15} className="mt-0.5 shrink-0 text-danger" />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-boss" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {issue.scope}
                  </span>
                  <span className="block text-[13px] text-ink-muted">{issue.message}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
