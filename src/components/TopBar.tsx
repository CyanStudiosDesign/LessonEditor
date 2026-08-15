import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Download,
  Play,
  Redo2,
  Search,
  ShieldCheck,
  Undo2,
  Upload,
} from 'lucide-react'
import type { ValidationReport } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button, IconButton } from '@/components/ui/Button'

export function TopBar({
  report,
  onImport,
  onPreview,
  onExport,
  onValidate,
  onSearch,
  onViewJson,
  canPreview,
}: {
  report: ValidationReport
  onImport: () => void
  onPreview: () => void
  onExport: () => void
  onValidate: () => void
  onSearch: () => void
  onViewJson: () => void
  canPreview: boolean
}) {
  const { saved, canUndo, canRedo, dispatch } = useStudio()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-edge bg-panel px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Braces size={16} />
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-ink">Curriculum Studio</h1>
          <p className="text-[10px] tracking-wide text-ink-faint">LessonEditor</p>
        </div>
      </div>

      <span
        className={cn(
          'ml-2 hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11px] sm:flex',
          saved ? 'text-ink-faint' : 'text-boss',
        )}
        title={
          saved
            ? 'Saved to this browser’s localStorage'
            : 'Changes are saved locally a moment after you stop typing'
        }
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            saved ? 'bg-success' : 'animate-pulse bg-boss',
          )}
        />
        {saved ? 'All changes saved locally' : 'Unsaved changes'}
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <IconButton label="Undo (⌘Z)" disabled={!canUndo} onClick={() => dispatch({ type: 'undo' })}>
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label="Redo (⇧⌘Z)"
          disabled={!canRedo}
          onClick={() => dispatch({ type: 'redo' })}
        >
          <Redo2 size={15} />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-edge" />

        <Button variant="ghost" onClick={onSearch}>
          <Search size={14} /> <span className="hidden md:inline">Search</span>
          <kbd className="ml-1 hidden rounded border border-edge px-1 font-mono text-[10px] text-ink-faint lg:inline">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          onClick={onValidate}
          className={report.errors.length > 0 ? 'text-danger' : undefined}
        >
          {report.errors.length > 0 ? (
            <AlertTriangle size={14} />
          ) : report.warnings.length > 0 ? (
            <ShieldCheck size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}
          <span className="hidden md:inline">
            {report.issues.length === 0 ? 'Valid' : `${report.issues.length} issues`}
          </span>
        </Button>

        <Button variant="ghost" onClick={onViewJson}>
          <Braces size={14} /> <span className="hidden lg:inline">JSON</span>
        </Button>

        <Button onClick={onImport}>
          <Upload size={14} /> Import JSON
        </Button>
        <Button onClick={onPreview} disabled={!canPreview}>
          <Play size={14} /> Preview
        </Button>
        <Button variant="primary" onClick={onExport}>
          <Download size={14} /> Export JSON
        </Button>
      </div>
    </header>
  )
}
