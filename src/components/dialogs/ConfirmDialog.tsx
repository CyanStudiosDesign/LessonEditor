import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{description}</p>
    </Modal>
  )
}
