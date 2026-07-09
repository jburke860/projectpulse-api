import { X } from 'lucide-react'
import type { Label } from '../api/types'

interface LabelChipProps {
  label: Label
  onRemove?: () => void
  disabled?: boolean
}

export function LabelChip({ label, onRemove, disabled }: LabelChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[0.65rem] font-semibold text-[#cbd5e1]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
      {label.name}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove label ${label.name}`}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          className="rounded-full transition hover:bg-white/20 disabled:opacity-50"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
    </span>
  )
}
