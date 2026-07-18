import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { UserProfile } from '../api/types'
import { MemberProfileDialog } from './MemberProfileDialog'

vi.mock('../api/client', () => ({
  getData: vi.fn(),
  postData: vi.fn(),
  putData: vi.fn(),
  patchData: vi.fn(),
  deleteData: vi.fn(),
  postFormData: vi.fn(),
}))

const { getData } = await import('../api/client')

const profile: UserProfile = {
  id: 'user-1',
  displayName: 'Ava Chen',
  email: 'ava.chen@projectpulse.local',
  avatarColor: '#22c55e',
  joinedAtUtc: '2026-05-01T10:00:00Z',
  activeTaskCount: 3,
  completedTaskCount: 2,
  overdueTaskCount: 1,
  memberships: [
    {
      projectId: 'p1',
      projectName: 'Customer Portal Redesign',
      projectStatus: 'Active',
      role: 'Member',
      icon: 'rocket',
      color: '#ff7b22',
    },
  ],
  recentActivity: [
    {
      id: 'a1',
      projectId: 'p1',
      taskId: 't1',
      actorId: 'user-1',
      actorName: 'Ava Chen',
      action: 'Commented',
      entityType: 'TaskItem',
      message: 'Ava Chen commented on "Fix login".',
      createdAtUtc: '2026-07-17T12:00:00Z',
    },
  ],
}

function renderDialog(sessionUserId?: string, onClose = vi.fn()) {
  vi.mocked(getData).mockResolvedValue(profile)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MemberProfileDialog userId="user-1" sessionUserId={sessionUserId} onClose={onClose} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return onClose
}

describe('MemberProfileDialog', () => {
  it('renders identity, stats, memberships with roles, and activity', async () => {
    renderDialog()

    expect(await screen.findByText('Ava Chen')).toBeInTheDocument()
    expect(screen.getByText('ava.chen@projectpulse.local')).toBeInTheDocument()
    expect(screen.getByText(/Joined May 1, 2026/)).toBeInTheDocument()
    // "Projects" appears as both a stat label and the section heading.
    expect(screen.getAllByText('Projects')).toHaveLength(2)
    expect(screen.getByText('Customer Portal Redesign')).toBeInTheDocument()
    // "Member" appears as the dialog eyebrow and the role badge.
    expect(screen.getAllByText('Member')).toHaveLength(2)
    expect(screen.getByText('Ava Chen commented on "Fix login".')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jump to task' })).toBeInTheDocument()
  })

  it('offers Edit profile only for the session user', async () => {
    renderDialog('user-1')
    expect(await screen.findByRole('button', { name: /Edit profile/ })).toBeInTheDocument()
  })

  it('hides Edit profile for other members', async () => {
    renderDialog('someone-else')
    await screen.findByText('Ava Chen')
    expect(screen.queryByRole('button', { name: /Edit profile/ })).not.toBeInTheDocument()
  })

  it('closes when jumping to a project', async () => {
    const onClose = renderDialog()
    fireEvent.click(await screen.findByText('Customer Portal Redesign'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes when jumping to the assignee-filtered tasks view', async () => {
    const onClose = renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: /View assigned tasks/ }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
