import {
  BarChart3,
  BookOpen,
  Database,
  Globe,
  Megaphone,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface ProjectIconOption {
  name: string
  icon: LucideIcon
  label: string
}

// Icon names are persisted on the project, so keep them stable.
export const projectIconOptions: ProjectIconOption[] = [
  { name: 'rocket', icon: Rocket, label: 'Launch' },
  { name: 'workflow', icon: Workflow, label: 'Workflow' },
  { name: 'bar-chart', icon: BarChart3, label: 'Analytics' },
  { name: 'smartphone', icon: Smartphone, label: 'Mobile' },
  { name: 'globe', icon: Globe, label: 'Web' },
  { name: 'shield', icon: ShieldCheck, label: 'Security' },
  { name: 'database', icon: Database, label: 'Data' },
  { name: 'wrench', icon: Wrench, label: 'Tooling' },
  { name: 'users', icon: Users, label: 'Team' },
  { name: 'book', icon: BookOpen, label: 'Docs' },
  { name: 'megaphone', icon: Megaphone, label: 'Marketing' },
  { name: 'sparkles', icon: Sparkles, label: 'Ideas' },
]

export const projectColorOptions = [
  '#ff7b22',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#38bdf8',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
]

export const projectIconsByName: Record<string, LucideIcon> = Object.fromEntries(
  projectIconOptions.map((option) => [option.name, option.icon]),
)

export function projectIconByName(name: string | null | undefined): LucideIcon | null {
  if (!name) return null
  return projectIconsByName[name] ?? null
}

/** Mix a #rrggbb color toward white for the light end of a tile gradient. */
export function lightenColor(hex: string, amount = 0.4): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16)
    return Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, '0')
  })
  return `#${channels.join('')}`
}
