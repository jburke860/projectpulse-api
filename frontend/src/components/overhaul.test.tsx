import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { emptyTaskFilters } from '../lib/taskFilters'
import { Avatar } from './Avatar'
import { CommandPalette } from './CommandPalette'
import { DonutChart } from './DonutChart'
import { FileTypeIcon } from './FileTypeIcon'
import { ProfileDialog } from './ProfileDialog'
import { TaskFilterMenu } from './TaskFilterMenu'

describe('DonutChart', () => {
  const segments = [
    { label: 'Active', value: 4, color: '#ff7b22' },
    { label: 'Planning', value: 2, color: '#38bdf8' },
    { label: 'Completed', value: 0, color: '#22c55e' },
  ]

  it('renders one arc per non-zero segment plus the center value', () => {
    const { container } = render(
      <DonutChart segments={segments} centerValue="18%" centerLabel="Complete" />,
    )
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    expect(screen.getByText('18%')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('covers the full circumference across segments', () => {
    const { container } = render(<DonutChart segments={segments} centerValue="18%" size={180} strokeWidth={18} />)
    const circumference = 2 * Math.PI * ((180 - 18) / 2)
    const drawn = [...container.querySelectorAll('circle')].reduce((sum, circle) => {
      const [dash] = (circle.getAttribute('stroke-dasharray') ?? '0 0').split(' ').map(Number)
      return sum + dash
    }, 0)
    // Dashes shrink slightly to leave gaps between segments, never grow.
    expect(drawn).toBeLessThanOrEqual(circumference)
    expect(drawn).toBeGreaterThan(circumference * 0.9)
  })

  it('renders a placeholder ring when everything is zero', () => {
    const { container } = render(
      <DonutChart segments={[{ label: 'Active', value: 0, color: '#ff7b22' }]} centerValue="0%" />,
    )
    expect(container.querySelectorAll('circle')).toHaveLength(1)
  })
})

describe('Avatar', () => {
  it('renders initials and a presence dot', () => {
    render(<Avatar name="Jeremy Burke" id="user-1" presence="online" />)
    expect(screen.getByText('JB')).toBeInTheDocument()
    expect(screen.getByTitle('Online')).toBeInTheDocument()
  })

  it('is deterministic for the same id', () => {
    const { container: first } = render(<Avatar name="Jeremy Burke" id="user-1" />)
    const { container: second } = render(<Avatar name="Jeremy Burke" id="user-1" />)
    expect(first.innerHTML).toBe(second.innerHTML)
  })
})

describe('FileTypeIcon', () => {
  it('colors by extension', () => {
    const { container: pdf } = render(<FileTypeIcon fileName="brief.pdf" />)
    const { container: sheet } = render(<FileTypeIcon fileName="numbers.xlsx" />)
    expect(pdf.firstElementChild?.getAttribute('style')).toContain('239, 68, 68')
    expect(sheet.firstElementChild?.getAttribute('style')).toContain('16, 185, 129')
  })
})

describe('TaskFilterMenu', () => {
  const assignees = [{ userId: 'u1', displayName: 'Jeremy Burke' }]
  const labels = [{ id: 'l1', name: 'security', color: '#ef4444' }]

  it('shows an active-filter count and reports changes', () => {
    const onChange = vi.fn()
    render(
      <TaskFilterMenu
        filters={{ ...emptyTaskFilters, status: 'Open' }}
        assignees={assignees}
        labels={labels}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    fireEvent.change(screen.getByLabelText(/Priority/), { target: { value: 'High' } })
    expect(onChange).toHaveBeenCalledWith({ ...emptyTaskFilters, status: 'Open', priority: 'High' })
  })

  it('hides the label filter when no labels are available', () => {
    render(
      <TaskFilterMenu filters={emptyTaskFilters} assignees={assignees} labels={[]} onChange={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.queryByLabelText(/Label/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument()
  })
})

describe('CommandPalette', () => {
  function renderPalette() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, enabled: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CommandPalette />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('opens via the pp:open-palette event and filters navigation', async () => {
    renderPalette()
    expect(screen.queryByPlaceholderText(/Search projects/)).not.toBeInTheDocument()

    fireEvent(window, new CustomEvent('pp:open-palette'))
    const input = await screen.findByPlaceholderText(/Search projects/)

    fireEvent.change(input, { target: { value: 'calen' } })
    await waitFor(() => {
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })
  })

  it('closes on Escape', async () => {
    renderPalette()
    fireEvent(window, new CustomEvent('pp:open-palette'))
    await screen.findByPlaceholderText(/Search projects/)

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Search projects/)).not.toBeInTheDocument()
    })
  })
})

describe('ProfileDialog', () => {
  function renderDialog(onClose = vi.fn()) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, enabled: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileDialog
          userId="user-1"
          name="Demo User"
          email="jeremy.demo@projectpulse.local"
          avatarColor={null}
          onClose={onClose}
        />
      </QueryClientProvider>,
    )
    return onClose
  }

  it('prefills the current display name and locks the email', () => {
    renderDialog()
    expect(screen.getByLabelText('Display name')).toHaveValue('Demo User')
    expect(screen.getByLabelText('Email')).toBeDisabled()
  })

  it('disables saving when the name is emptied and closes on Cancel', () => {
    const onClose = renderDialog()
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
