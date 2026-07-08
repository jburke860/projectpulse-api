import { render, screen } from '@testing-library/react'
import { FolderKanban } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Badge } from './ui'
import { EmptyState } from './EmptyState'
import { LabelChip } from './LabelChip'
import { ProjectIconTile } from './ProjectIconTile'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders label, value, and hint', () => {
    render(<StatCard label="Total projects" value={8} hint="All time" icon={FolderKanban} />)
    expect(screen.getByText('Total projects')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('All time')).toBeInTheDocument()
  })
})

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge tone="green">Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

describe('ProjectIconTile', () => {
  it('is deterministic for the same project id', () => {
    const { container: first } = render(<ProjectIconTile projectId="project-a" />)
    const { container: second } = render(<ProjectIconTile projectId="project-a" />)
    expect(first.innerHTML).toBe(second.innerHTML)
  })
})

describe('LabelChip', () => {
  const label = { id: 'l1', name: 'frontend', color: '#f97316' }

  it('renders the label name', () => {
    render(<LabelChip label={label} />)
    expect(screen.getByText('frontend')).toBeInTheDocument()
  })

  it('calls onRemove when the remove button is clicked', () => {
    const onRemove = vi.fn()
    render(<LabelChip label={label} onRemove={onRemove} />)
    screen.getByRole('button', { name: 'Remove label frontend' }).click()
    expect(onRemove).toHaveBeenCalledOnce()
  })
})

describe('EmptyState', () => {
  it('renders title, description, and action', () => {
    render(
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project."
        action={<button type="button">New project</button>}
      />,
    )
    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first project.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument()
  })
})
