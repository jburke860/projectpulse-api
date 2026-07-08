import {
  BarChart3,
  Blocks,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/cn'

interface TileStyle {
  icon: LucideIcon
  gradient: string
}

const tileStyles: TileStyle[] = [
  { icon: Rocket, gradient: 'bg-gradient-to-br from-[#ff5a1f] to-[#ff9f3f] shadow-[0_12px_28px_rgba(255,90,31,0.28)]' },
  { icon: Users, gradient: 'bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-[0_12px_28px_rgba(124,58,237,0.28)]' },
  { icon: Smartphone, gradient: 'bg-gradient-to-br from-[#2563eb] to-[#60a5fa] shadow-[0_12px_28px_rgba(37,99,235,0.28)]' },
  { icon: BarChart3, gradient: 'bg-gradient-to-br from-[#0d9488] to-[#5eead4] shadow-[0_12px_28px_rgba(13,148,136,0.28)]' },
  { icon: Workflow, gradient: 'bg-gradient-to-br from-[#d97706] to-[#fbbf24] shadow-[0_12px_28px_rgba(217,119,6,0.28)]' },
  { icon: ShieldCheck, gradient: 'bg-gradient-to-br from-[#dc2626] to-[#f87171] shadow-[0_12px_28px_rgba(220,38,38,0.28)]' },
  { icon: Blocks, gradient: 'bg-gradient-to-br from-[#db2777] to-[#f472b6] shadow-[0_12px_28px_rgba(219,39,119,0.28)]' },
  { icon: Sparkles, gradient: 'bg-gradient-to-br from-[#059669] to-[#6ee7b7] shadow-[0_12px_28px_rgba(5,150,105,0.28)]' },
]

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

interface ProjectIconTileProps {
  projectId: string
  className?: string
  iconClassName?: string
}

export function ProjectIconTile({ projectId, className, iconClassName }: ProjectIconTileProps) {
  const { icon: Icon, gradient } = tileStyles[hashString(projectId) % tileStyles.length]

  return (
    <span
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-[0.85rem] border border-white/10 text-white',
        gradient,
        className,
      )}
    >
      <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden />
    </span>
  )
}
