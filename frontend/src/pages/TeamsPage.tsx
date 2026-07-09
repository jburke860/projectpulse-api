import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useUsers } from '../api/queries'
import { Avatar } from '../components/Avatar'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/Skeleton'
import { Card, PageHeader } from '../components/ui'
import { useDemoSession } from '../demo/DemoSessionContext'
import { presenceFor, presenceTone } from '../lib/presence'

export function TeamsPage() {
  const { data: users = [], isLoading } = useUsers()
  const { userId: sessionUserId } = useDemoSession()
  const [searchText, setSearchText] = useState('')

  const visibleUsers = users.filter(
    (user) =>
      !searchText ||
      `${user.displayName} ${user.email}`.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="People"
        title="Teams"
        description={`${users.length} member${users.length === 1 ? '' : 's'} collaborating in this workspace.`}
      />

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687387]"
          aria-hidden
        />
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members..."
          className="pp-input pp-input-icon-left text-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} lines={2} />
          ))}
        </div>
      ) : visibleUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members match"
          description="Try a different name or email."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUsers.map((user) => {
            const presence = presenceFor(user.id, sessionUserId)

            return (
              <li key={user.id}>
                <Card className="flex items-center gap-4 p-5">
                  <Avatar name={user.displayName} id={user.id} size="lg" presence={presence} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#f8fafc]">{user.displayName}</p>
                    <p className="truncate text-xs text-[#8e99ad]">{user.email}</p>
                    <p className="mt-1.5 text-xs text-[#8e99ad]">
                      {user.projectCount} project{user.projectCount === 1 ? '' : 's'} ·{' '}
                      {user.assignedTaskCount} active task{user.assignedTaskCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-semibold"
                    style={{ color: presenceTone[presence].dot }}
                  >
                    {presenceTone[presence].label}
                  </span>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
