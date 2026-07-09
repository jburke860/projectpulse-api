import { hashString, initialsFor } from '../lib/avatar'
import { presenceTone, type Presence } from '../lib/presence'
import { cn } from '../lib/cn'

const gradients = [
  'linear-gradient(135deg, #d92d20, #ff7b22)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #0284c7, #38bdf8)',
  'linear-gradient(135deg, #0d9488, #2dd4bf)',
  'linear-gradient(135deg, #ca8a04, #facc15)',
  'linear-gradient(135deg, #db2777, #f472b6)',
  'linear-gradient(135deg, #4f46e5, #818cf8)',
  'linear-gradient(135deg, #16a34a, #4ade80)',
]

const sizes = {
  sm: 'h-7 w-7 text-[0.6rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

interface AvatarProps {
  name: string
  /** Stable id used to pick the gradient; falls back to the name. */
  id?: string
  size?: keyof typeof sizes
  presence?: Presence
  className?: string
}

export function Avatar({ name, id, size = 'md', presence, className }: AvatarProps) {
  const gradient = gradients[hashString(id ?? name) % gradients.length]

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]',
          sizes[size],
        )}
        style={{ background: gradient }}
        aria-hidden
      >
        {initialsFor(name)}
      </span>
      {presence && (
        <span
          title={presenceTone[presence].label}
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0d13]"
          style={{ backgroundColor: presenceTone[presence].dot }}
        />
      )}
    </span>
  )
}
