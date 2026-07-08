import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-[#8e99ad]">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 text-sm font-semibold text-[#f8fafc]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-[#8e99ad]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
