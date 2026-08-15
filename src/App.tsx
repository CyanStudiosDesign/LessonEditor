import { useCallback, useEffect, useMemo, useState } from 'react'
import { MousePointerSquareDashed } from 'lucide-react'
import { StudioProvider, useSelectedLesson, useStudio } from '@/state/store'
import { validateCurriculum } from '@/lib/validation'
import { downloadCurriculum } from '@/lib/download'
import { TopBar } from '@/components/TopBar'
import { CurriculumTree } from '@/components/CurriculumTree'
import { ChapterEditor } from '@/components/editors/ChapterEditor'
import { UnitEditor } from '@/components/editors/UnitEditor'
import { LessonEditor } from '@/components/editors/LessonEditor'
import { ImportDialog } from '@/components/dialogs/ImportDialog'
import { PreviewDialog } from '@/components/dialogs/PreviewDialog'
import { ValidationDialog } from '@/components/dialogs/ValidationDialog'
import { SearchDialog } from '@/components/dialogs/SearchDialog'
import { JsonDialog } from '@/components/dialogs/JsonDialog'

type DialogName = 'import' | 'preview' | 'validation' | 'search' | 'json' | null

function Workspace() {
  const { curriculum, selection, dispatch } = useStudio()
  const lesson = useSelectedLesson()
  const [dialog, setDialog] = useState<DialogName>(null)
  const [exportBlocked, setExportBlocked] = useState(false)

  const report = useMemo(() => validateCurriculum(curriculum), [curriculum])

  const selectedUnit =
    selection.kind === 'unit'
      ? curriculum.units.find((unit) => unit.id === selection.unitId)
      : undefined

  /* Export refuses to write an invalid file — errors open the issue list. */
  const handleExport = useCallback(() => {
    const fresh = validateCurriculum(curriculum)
    if (!fresh.valid) {
      setExportBlocked(true)
      setDialog('validation')
      return
    }
    downloadCurriculum(curriculum)
  }, [curriculum])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return
      const key = event.key.toLowerCase()
      if (key === 'k') {
        event.preventDefault()
        setDialog('search')
      } else if (key === 'z') {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' })
      } else if (key === 's') {
        event.preventDefault()
        handleExport()
      } else if (key === 'i') {
        event.preventDefault()
        setDialog('import')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, handleExport])

  const closeDialog = useCallback(() => {
    setDialog(null)
    setExportBlocked(false)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <TopBar
        report={report}
        canPreview={Boolean(lesson && lesson.activities.length > 0)}
        onImport={() => setDialog('import')}
        onPreview={() => setDialog('preview')}
        onExport={handleExport}
        onValidate={() => setDialog('validation')}
        onSearch={() => setDialog('search')}
        onViewJson={() => setDialog('json')}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[14rem_1fr] md:grid-cols-[minmax(260px,320px)_1fr] md:grid-rows-1">
        <aside className="min-h-0 border-b border-edge bg-panel/60 md:border-r md:border-b-0">
          <CurriculumTree />
        </aside>

        <main className="min-h-0 overflow-y-auto">
          {selection.kind === 'chapter' ? <ChapterEditor /> : null}

          {selection.kind === 'unit' ? (
            selectedUnit ? (
              <UnitEditor unit={selectedUnit} />
            ) : (
              <EmptyState message="That unit no longer exists." />
            )
          ) : null}

          {selection.kind === 'lesson' || selection.kind === 'activity' ? (
            lesson ? (
              <LessonEditor
                lesson={lesson}
                selectedActivityId={
                  selection.kind === 'activity' ? selection.activityId : undefined
                }
                onPreview={() => setDialog('preview')}
              />
            ) : (
              <EmptyState message="That lesson no longer exists." />
            )
          ) : null}
        </main>
      </div>

      <ImportDialog open={dialog === 'import'} onClose={closeDialog} />
      <PreviewDialog lesson={lesson} open={dialog === 'preview'} onClose={closeDialog} />
      <SearchDialog open={dialog === 'search'} onClose={closeDialog} />
      <JsonDialog open={dialog === 'json'} onClose={closeDialog} />
      <ValidationDialog
        open={dialog === 'validation'}
        report={report}
        onClose={closeDialog}
        onExportAnyway={
          exportBlocked
            ? undefined
            : () => {
                closeDialog()
                handleExport()
              }
        }
      />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
      <MousePointerSquareDashed size={22} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default function App() {
  return (
    <StudioProvider>
      <Workspace />
    </StudioProvider>
  )
}
