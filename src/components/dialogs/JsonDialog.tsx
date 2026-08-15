import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toJson } from '@/lib/schema'
import { exportFileName } from '@/lib/download'
import { useStudio } from '@/state/store'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/** Live view of the exact bytes Export JSON would write. */
export function JsonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { curriculum } = useStudio()
  const [copied, setCopied] = useState(false)
  const json = toJson(curriculum)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={exportFileName(curriculum)}
      subtitle="Exactly what Export JSON writes — nothing added, nothing renamed."
      footer={
        <>
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
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </>
      }
    >
      <pre className="max-h-[60vh] overflow-auto rounded-xl border border-edge bg-canvas p-4 font-mono text-[12px] leading-relaxed text-ink-muted">
        {json}
      </pre>
    </Modal>
  )
}
