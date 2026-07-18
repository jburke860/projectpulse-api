import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, History, Pencil, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '../api/queries'
import { formatActivityTime, formatShortDate } from '../lib/dates'
import { presenceFor } from '../lib/presence'
import { formatProjectStatus, projectStatusTone } from '../lib/projectStatus'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { Avatar } from './Avatar'
import { ProfileDialog } from './ProfileDialog'
import { ProjectIconTile } from './ProjectIconTile'
import { Badge } from './ui'

const roleTones: Record<string, 'neutral' | 'orange' | 'green' | 'yellow' | 'red'> = {
  Admin: 'orange',
  Member: 'green',
  Viewer: 'neutral',
}

interface MemberProfileDialogProps {
  userId: string
  sessionUserId?: string
  onClose: () => void
}

export function MemberProfileDialog({ userId, sessionUserId, onClose }: MemberProfileDialogProps) {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useUserProfile(userId)
  const [editing, setEditing] = useState(false)
  const isSelf = Boolean(sessionUserId) && userId === sessionUserId
  useEscapeToClose(onClose, !editing)

  if (editing && profile) {
    // Swap to the existing edit dialog; closing it returns to the profile,
    // which refetches through the blanket invalidation after saving.
    return (
      <ProfileDialog
        userId={profile.id}
        name={profile.displayName}
        email={profile.email}
        avatarColor={profile.avatarColor}
        onClose={() => setEditing(false)}
      />
    )
  }

  const stats = profile
    ? [
        { label: 'Projects', value: profile.memberships.length },
        { label: 'Active', value: profile.activeTaskCount },
        { label: 'Completed', value: profile.completedTaskCount },
        { label: 'Overdue', value: profile.overdueTaskCount },
      ]
    : []

  // Portaled to <body> so transformed/filtered ancestors can never hijack
  // the fixed positioning.
  return createPortal(
    <>
      <button
        type="button"
        className="pp-overlay-enter fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close member profile"
        onClick={onClose}
      />
      <aside className="pp-card pp-dialog-enter fixed left-1/2 top-1/2 z-50 max-h-[min(85vh,44rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pp-divider pb-4">
          <div>
            <p className="pp-eyebrow">Member</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#f8fafc]">
              <UserRound className="h-4 w-4 text-[#ffb36c]" aria-hidden />
              Profile
            </h2>
          </div>
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>

        {isLoading || !profile ? (
          <div className="mt-5 space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.05]" />
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar
                name={profile.displayName}
                id={profile.id}
                color={profile.avatarColor}
                size="lg"
                presence={presenceFor(profile.id, sessionUserId)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-[#f8fafc]">{profile.displayName}</p>
                <p className="truncate text-xs text-[#8e99ad]">{profile.email}</p>
                <p className="mt-0.5 text-xs text-[#687387]">
                  Joined {formatShortDate(profile.joinedAtUtc)}
                </p>
              </div>
              {isSelf && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="pp-button-ghost min-h-0 shrink-0 gap-1.5 px-3 py-2 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit profile
                </button>
              )}
            </div>

            <dl className="grid grid-cols-4 gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/[0.025] px-2 py-2.5 text-center"
                >
                  <dd className="text-lg font-bold text-[#f8fafc]">{stat.value}</dd>
                  <dt className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#8e99ad]">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="pp-eyebrow">Projects</h3>
              {profile.memberships.length === 0 ? (
                <p className="mt-2 text-sm text-[#8e99ad]">Not a member of any project yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {profile.memberships.map((membership) => (
                    <li key={membership.projectId}>
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          navigate(`/projects/${membership.projectId}`)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-2.5 text-left transition hover:bg-white/[0.06]"
                      >
                        <ProjectIconTile
                          projectId={membership.projectId}
                          icon={membership.icon}
                          color={membership.color}
                          className="h-9 w-9 rounded-[0.7rem]"
                          iconClassName="h-4 w-4"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#f8fafc]">
                            {membership.projectName}
                          </span>
                          <span className="mt-0.5 block">
                            <Badge tone={projectStatusTone(membership.projectStatus)}>
                              {formatProjectStatus(membership.projectStatus)}
                            </Badge>
                          </span>
                        </span>
                        <Badge tone={roleTones[membership.role] ?? 'neutral'}>{membership.role}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="pp-eyebrow flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" aria-hidden />
                Recent activity
              </h3>
              {profile.recentActivity.length === 0 ? (
                <p className="mt-2 text-sm text-[#8e99ad]">No recent activity.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {profile.recentActivity.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5 text-[#cbd5e1]">{entry.message}</p>
                        <p className="mt-0.5 text-xs text-[#687387]">
                          {formatActivityTime(entry.createdAtUtc)}
                        </p>
                      </div>
                      {entry.taskId && (
                        <button
                          type="button"
                          aria-label="Jump to task"
                          onClick={() => {
                            onClose()
                            navigate(`/projects/${entry.projectId}?taskId=${entry.taskId}`)
                          }}
                          className="pp-button-ghost min-h-0 shrink-0 p-1.5"
                        >
                          <ArrowUpRight className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </aside>
    </>,
    document.body,
  )
}
