import {
  Braces,
  CircleCheck,
  Download,
  Play,
  Redo2,
  Search,
  TriangleAlert,
  Undo2,
  Upload,
} from 'lucide-react'
import type { ValidationReport } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { useStudio } from '@/state/store'
import { Button, IconButton, Separator } from '@/components/ui/Button'

/** ⌘ on Mac, Ctrl elsewhere — shortcut hints should match the actual key. */
const MOD =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘'
    : 'Ctrl'

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-edge bg-panel px-1 py-px font-sans text-[10.5px] leading-4 font-medium text-ink-faint">
      {children}
    </kbd>
  )
}

function SaveStatus() {
  const { saved } = useStudio()
  return (
    <span
      className="hidden items-center gap-1.5 text-[12px] text-ink-faint lg:flex"
      title={
        saved
          ? 'Saved to this browser’s localStorage'
          : 'Saved locally a moment after you stop typing'
      }
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          saved ? 'bg-success' : 'animate-pulse bg-warning',
        )}
      />
      {saved ? 'Saved locally' : 'Saving…'}
    </span>
  )
}

/** Compact command-palette launcher rather than a plain button. */
function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 w-full max-w-[19rem] items-center gap-2 rounded-lg border border-edge',
        'bg-panel-2 pr-1.5 pl-2.5 text-left transition-colors duration-150',
        'hover:border-edge-strong hover:bg-panel',
      )}
    >
      <Search size={14} className="shrink-0 text-ink-faint" />
      <span className="flex-1 truncate text-[13px] text-ink-faint">
        Search curriculum…
      </span>
      <Kbd>{`${MOD}K`}</Kbd>
    </button>
  )
}

function ValidationPill({
  report,
  onClick,
}: {
  report: ValidationReport
  onClick: () => void
}) {
  const { errors, warnings, issues } = report
  const tone = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        tone === 'ok'
          ? 'Curriculum is valid'
          : `${issues.length} validation ${issues.length === 1 ? 'issue' : 'issues'}`
      }
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[13px]',
        'font-medium transition-colors duration-150',
        tone === 'error' &&
          'border-danger/25 bg-danger-soft text-danger hover:border-danger/40',
        tone === 'warning' &&
          'border-warning/25 bg-warning-soft text-warning hover:border-warning/40',
        tone === 'ok' && 'border-edge bg-panel text-ink-muted hover:bg-panel-2',
      )}
    >
      {tone === 'ok' ? (
        <CircleCheck size={14} className="text-success" />
      ) : (
        <TriangleAlert size={14} />
      )}
      <span className="tabular-nums">{tone === 'ok' ? 'Valid' : issues.length}</span>
    </button>
  )
}

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
  const { canUndo, canRedo, dispatch } = useStudio()

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-edge bg-panel px-3">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
          <Braces size={15} strokeWidth={2.25} />
        </span>
        <div className="hidden leading-tight sm:block">
          <h1 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">
            LessonEditor
          </h1>
          <p className="text-[11px] text-ink-faint">Curriculum Studio</p>
        </div>
      </div>

      <Separator className="hidden sm:block" />

      {/* Search — flexible middle */}
      <div className="flex min-w-0 flex-1 justify-start">
        <SearchTrigger onClick={onSearch} />
      </div>

      <SaveStatus />

      {/* History */}
      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          label={`Undo (${MOD}Z)`}
          disabled={!canUndo}
          onClick={() => dispatch({ type: 'undo' })}
        >
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label={`Redo (⇧${MOD}Z)`}
          disabled={!canRedo}
          onClick={() => dispatch({ type: 'redo' })}
        >
          <Redo2 size={15} />
        </IconButton>
      </div>

      <Separator />

      <ValidationPill report={report} onClick={onValidate} />

      {/* Document actions — Export is the only primary. */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" onClick={onViewJson} title="View raw JSON">
          <Braces size={14} />
          <span className="hidden xl:inline">JSON</span>
        </Button>
        <Button variant="outline" onClick={onImport} title={`Import JSON (${MOD}I)`}>
          <Upload size={14} />
          <span className="hidden lg:inline">Import</span>
        </Button>
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={!canPreview}
          title={canPreview ? 'Preview lesson' : 'Select a lesson that has activities'}
        >
          <Play size={14} />
          <span className="hidden lg:inline">Preview</span>
        </Button>
        <Button variant="primary" onClick={onExport} title={`Export JSON (${MOD}S)`}>
          <Download size={14} />
          <span className="hidden md:inline">Export JSON</span>
        </Button>
      </div>
    </header>
  )
}
