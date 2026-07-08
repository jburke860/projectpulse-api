import { X } from 'lucide-react'
import type { Label } from '../api/types'

interface LabelChipProps {
  label: Label
  onRemove?: () => void
  disabled?: boolean
}

export function LabelChip({ label, onRemove, disabled }: LabelChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
      style={{ backgroundColor: `${label.color}26`, color: label.color }}
    >
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
