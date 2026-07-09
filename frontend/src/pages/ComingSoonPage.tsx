import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/ui'

interface ComingSoonPageProps {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
}

export function ComingSoonPage({ icon, eyebrow, title, description }: ComingSoonPageProps) {
  return (
    <div className="pp-page-shell">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon={icon}
        title="This section is on the way"
        description="It is being built as part of the workspace overhaul and will light up in an upcoming update."
      />
    </div>
  )
}
