import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { Button } from './ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEscapeToClose(onCancel, open)

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus()

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return

      const focusables = dialog.querySelectorAll<HTMLElement>('button:not(:disabled)')
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', trapFocus)
    return () => {
      window.removeEventListener('keydown', trapFocus)
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="pp-card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f87171]/30 bg-[#ef4444]/10 text-[#fca5a5]">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#f8fafc]">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#a9b1c0]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </>
  )
}
