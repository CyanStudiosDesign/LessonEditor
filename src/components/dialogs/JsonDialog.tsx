import { useMemo, useState, type ReactNode } from 'react'
import { Braces, Check, Copy, Download } from 'lucide-react'
import { toJson } from '@/lib/schema'
import { downloadCurriculum, exportFileName } from '@/lib/download'
import { validateCurriculum } from '@/lib/validation'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/**
 * Minimal JSON tokenizer — enough for readable colouring without pulling in a
 * syntax-highlighting dependency for a read-only inspection panel.
 */
const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g

const COLORS = {
  key: '#9cd0ff',
  string: '#b6e3a0',
  number: '#d5b3ff',
  literal: '#ffc48a',
}

function highlight(json: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0

  for (const match of json.matchAll(TOKEN)) {
    const start = match.index
    if (start > last) nodes.push(json.slice(last, start))

    const [, quoted, colon, number, literal] = match
    if (quoted !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: colon ? COLORS.key : COLORS.string }}>
          {quoted}
        </span>,
      )
      if (colon) nodes.push(colon)
    } else if (number !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: COLORS.number }}>
          {number}
        </span>,
      )
    } else if (literal !== undefined) {
      nodes.push(
        <span key={key++} style={{ color: COLORS.literal }}>
          {literal}
        </span>,
      )
    }
    last = start + match[0].length
  }

  if (last < json.length) nodes.push(json.slice(last))
  return nodes
}

/** Live view of the exact bytes Export JSON would write. */
export function JsonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { curriculum } = useStudio()
  const [copied, setCopied] = useState(false)

  const json = useMemo(() => toJson(curriculum), [curriculum])
  const highlighted = useMemo(() => highlight(json), [json])
  const valid = useMemo(() => validateCurriculum(curriculum).valid, [curriculum])

  const lineCount = json.split('\n').length
  const sizeKb = (new TextEncoder().encode(json).length / 1024).toFixed(1)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      flush
      icon={
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Braces size={14} />
        </span>
      }
      title={<span className="font-mono">{exportFileName(curriculum)}</span>}
      subtitle="Exactly what Export JSON writes — nothing added, nothing renamed."
      footer={
        <>
          <span className="mr-auto text-[11.5px] tabular-nums text-ink-faint">
            {lineCount} lines · {sizeKb} KB
          </span>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(json)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            title={valid ? 'Download the file' : 'Fix validation errors first'}
            onClick={() => downloadCurriculum(curriculum)}
          >
            <Download size={14} /> Download
          </Button>
        </>
      }
    >
      <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-edge">
        <pre className="max-h-[58vh] overflow-auto bg-[#16181d] p-4 font-mono text-[12.5px] leading-relaxed text-[#e2e4e9]">
          {highlighted}
        </pre>
      </div>
    </Modal>
  )
}
