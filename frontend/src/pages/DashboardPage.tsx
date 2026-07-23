import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FolderKanban,
  PieChart,
  Plus,
  SquareCheck,
  Users,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDashboard, useProjects, useTasks, useUsers } from '../api/queries'
import type { Task } from '../api/types'
import { ActivityFeed } from '../components/ActivityFeed'
import { Avatar } from '../components/Avatar'
import { DonutChart, type DonutSegment } from '../components/DonutChart'
import { MemberProfileDialog } from '../components/MemberProfileDialog'
import { DashboardSkeleton } from '../components/Skeleton'
import { TaskPreviewDialog } from '../components/TaskPreviewDialog'
import { StatCard } from '../components/StatCard'
import { Badge, Button, Card } from '../components/ui'
import { useDemoSession } from '../demo/DemoSessionContext'
import { DEMO_SESSION_TEMPORARY_COPY } from '../demo/sessionConfig'
import { formatShortDate } from '../lib/dates'
import { getGreeting } from '../lib/greeting'
import { presenceFor } from '../lib/presence'
import {
  formatTaskStatus,
  isTaskOverdue,
  taskPriorityTones,
  taskStatusTones,
} from '../lib/tasks'
import { useEscapeToClose } from '../lib/useEscapeToClose'

const projectStatusColors: Record<string, string> = {
  Planning: '#38bdf8',
  Active: '#ff7b22',
  OnHold: '#f59e0b',
  Completed: '#22c55e',
}

const projectStatusLabels: Record<string, string> = {
  Planning: 'Planning',
  Active: 'Active',
  OnHold: 'On Hold',
  Completed: 'Completed',
}

const myTasksTabs = ['All Tasks', 'My Tasks', 'Overdue'] as const
type MyTasksTab = (typeof myTasksTabs)[number]

function QuickAddMenu() {
  const navigate = useNavigate()
  const { data: projects = [] } = useProjects()
  const [open, setOpen] = useState(false)
  useEscapeToClose(() => setOpen(false), open)

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="pp-button-secondary"
      >
        <Zap className="h-4 w-4" aria-hidden />
        Quick Add
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close quick add"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="pp-card pp-menu-enter absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/projects?create=1')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#f8fafc] transition hover:bg-white/[0.06]"
            >
              <FolderKanban className="h-4 w-4 text-[#ffb36c]" aria-hidden />
              New project
            </button>
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
              New task in...
            </p>
            <div className="max-h-52 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate(`/projects/${project.id}?newTask=1`)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#a9b1c0] transition hover:bg-white/[0.06] hover:text-[#f8fafc]"
                >
                  <SquareCheck className="h-4 w-4 shrink-0 text-[#687387]" aria-hidden />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MyTasksCard({ tasks, userId }: { tasks: Task[]; userId: string }) {
  const [tab, setTab] = useState<MyTasksTab>('All Tasks')
  const [previewTask, setPreviewTask] = useState<Task | null>(null)

  const filtered = tasks.filter((task) => {
    if (tab === 'My Tasks') return userId !== '' && task.assigneeId === userId
    if (tab === 'Overdue') return isTaskOverdue(task)
    return true
  })
  const visible = filtered.slice(0, 6)

  return (
    <Card className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SquareCheck className="h-4 w-4 text-[#ffb36c]" aria-hidden />
          <h2 className="text-lg font-bold text-[#f8fafc]">My Tasks</h2>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {myTasksTabs.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tab === option}
              onClick={() => setTab(option)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === option
                  ? 'bg-[#ff7b22]/15 text-[#fff7ed] shadow-[inset_0_0_0_1px_rgba(255,122,34,0.35)]'
                  : 'text-[#a9b1c0] hover:text-[#f8fafc]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-[#8e99ad]">
          {tab === 'Overdue' ? 'Nothing is overdue. Great job!' : 'No tasks here yet.'}
        </p>
      ) : (
        <>
          {/* Phones get stacked rows; the five-column table would force the
              whole page wider than the screen. */}
          <ul className="mt-3 divide-y divide-white/[0.06] md:hidden">
            {visible.map((task) => {
              const overdue = isTaskOverdue(task)

              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setPreviewTask(task)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#f8fafc]">{task.title}</span>
                      <span className="mt-0.5 block text-xs text-[#8e99ad]">
                        {task.projectName} · {task.priority} ·{' '}
                        <span className={overdue ? 'font-semibold text-[#fca5a5]' : undefined}>
                          {task.dueDateUtc ? `Due ${formatShortDate(task.dueDateUtc)}` : 'No due date'}
                        </span>
                      </span>
                    </span>
                    <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>{formatTaskStatus(task.status)}</Badge>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
                  <th className="pb-2 pr-3 font-semibold">Task</th>
                  <th className="pb-2 pr-3 font-semibold">Project</th>
                  <th className="pb-2 pr-3 font-semibold">Priority</th>
                  <th className="pb-2 pr-3 font-semibold">Due Date</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((task) => {
                  const overdue = isTaskOverdue(task)

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setPreviewTask(task)}
                      className="cursor-pointer border-t border-white/[0.06] transition hover:bg-white/[0.04]"
                    >
                      <td className="max-w-[14rem] truncate py-2.5 pr-3 font-medium text-[#f8fafc]">
                        {task.title}
                      </td>
                      <td className="max-w-[11rem] truncate py-2.5 pr-3 text-[#8e99ad]">{task.projectName}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={taskPriorityTones[task.priority] ?? 'neutral'}>{task.priority}</Badge>
                      </td>
                      <td className={`whitespace-nowrap py-2.5 pr-3 text-xs ${overdue ? 'font-semibold text-[#fca5a5]' : 'text-[#8e99ad]'}`}>
                        {task.dueDateUtc ? formatShortDate(task.dueDateUtc) : 'None'}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>{formatTaskStatus(task.status)}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Link
        to="/tasks"
        className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]"
      >
        View all tasks
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>

      <TaskPreviewDialog task={previewTask} onClose={() => setPreviewTask(null)} />
    </Card>
  )
}

function UpcomingDeadlinesCard({ tasks }: { tasks: Task[] }) {
  const [previewTask, setPreviewTask] = useState<Task | null>(null)

  const upcoming = tasks
    .filter((task) => task.dueDateUtc && task.status !== 'Done' && task.status !== 'Cancelled')
    .sort((a, b) => new Date(a.dueDateUtc!).getTime() - new Date(b.dueDateUtc!).getTime())
    .slice(0, 5)

  return (
    <Card className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#ffb36c]" aria-hidden />
          <h2 className="text-lg font-bold text-[#f8fafc]">Upcoming Deadlines</h2>
        </div>
        <Link to="/calendar" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
          Open calendar
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-[#8e99ad]">
          No open tasks with due dates.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {upcoming.map((task) => {
            const overdue = isTaskOverdue(task)

            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => setPreviewTask(task)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      overdue ? 'bg-[#ef4444]/15 text-[#fca5a5]' : 'bg-[#ff7b22]/12 text-[#ffb36c]'
                    }`}
                    aria-hidden
                  >
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#f8fafc]">{task.title}</span>
                    <span className="block truncate text-xs text-[#8e99ad]">{task.projectName}</span>
                  </span>
                  <span
                    className={`shrink-0 text-xs ${overdue ? 'font-semibold text-[#fca5a5]' : 'text-[#8e99ad]'}`}
                  >
                    {formatShortDate(task.dueDateUtc!)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <TaskPreviewDialog task={previewTask} onClose={() => setPreviewTask(null)} />
    </Card>
  )
}

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()
  const { data: tasks = [] } = useTasks()
  const { data: users = [] } = useUsers()
  const { isStartingSession, startNewSession, userId } = useDemoSession()
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleStartNewSession = async () => {
    const didStart = await startNewSession()
    if (didStart) {
      navigate('/', { replace: true })
    }
  }

  if (isLoading) return <DashboardSkeleton />
  if (error) return <p className="text-sm font-medium text-[#fecaca]">Could not load dashboard. Check the API deployment URL.</p>
  if (!data) return null
  if (data.totalProjects === 0) {
    return (
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-[#f8fafc]">Demo session expired</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a9b1c0]">
          This temporary demo session expired because the free hosted backend restarted. Start a fresh
          session to reload sample projects.
        </p>
        <Button
          type="button"
          disabled={isStartingSession}
          onClick={handleStartNewSession}
          className="mt-6"
        >
          {isStartingSession ? 'Starting...' : 'Start New Session'}
        </Button>
      </Card>
    )
  }

  const sessionUser = users.find((user) => user.id === userId)
  const displayName = sessionUser?.displayName ?? 'Demo User'
  const completionPercent = data.totalTasks > 0
    ? Math.round(((data.tasksByStatus.find((s) => s.status === 'Done')?.count ?? 0) / data.totalTasks) * 100)
    : 0
  const donutSegments: DonutSegment[] = data.projectsByStatus.map((entry) => ({
    label: projectStatusLabels[entry.status] ?? entry.status,
    value: entry.count,
    color: projectStatusColors[entry.status] ?? '#64748b',
  }))
  const topMembers = [...users].sort((a, b) => b.assignedTaskCount - a.assignedTaskCount).slice(0, 5)

  return (
    <div className="pp-page-shell">
      {/* overflow-hidden lives on the decoration layer, not the section,
          so the Quick Add dropdown is never clipped. */}
      <section className="pp-hero-card relative p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
          <svg className="absolute right-8 top-6 hidden h-14 w-56 xl:block" viewBox="0 0 288 80" fill="none">
            <defs>
              <linearGradient id="pp-pulse-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ff7b22" stopOpacity="0" />
                <stop offset="0.35" stopColor="#ff7b22" stopOpacity="0.55" />
                <stop offset="0.75" stopColor="#ffb347" stopOpacity="0.9" />
                <stop offset="1" stopColor="#ffb347" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path
              d="M2 40 H96 l10 -12 l10 12 h28 l12 -28 l14 50 l12 -36 l8 14 h94"
              stroke="url(#pp-pulse-stroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-normal text-[#f8fafc] sm:text-3xl">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="mt-2 max-w-2xl text-[#cbd5e1]">
              Here's what's happening across your workspace.
            </p>
            <p className="mt-3 max-w-2xl text-xs leading-5 text-[#8e99ad]">
              {DEMO_SESSION_TEMPORARY_COPY}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/projects?create=1" className="pp-button-primary">
              <Plus className="h-4 w-4" aria-hidden />
              New Project
            </Link>
            <QuickAddMenu />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Projects" value={data.totalProjects} hint="All time" accent="ember" icon={FolderKanban} />
        <StatCard label="Open Tasks" value={data.openTasks} hint="Needs attention" accent="amber" icon={SquareCheck} />
        <StatCard label="Completed Tasks" value={data.completedTasks} hint="All caught up" accent="sunset" icon={CheckCircle2} />
        <StatCard
          label="Overdue Tasks"
          value={data.overdueTasks}
          hint={data.overdueTasks === 0 ? 'Great job!' : 'Past due'}
          accent="rose"
          icon={Clock}
        />
        {/* Odd card out in the 2-col phone grid, so it spans the bottom row. */}
        <StatCard
          label="Team Members"
          value={data.teamMemberCount}
          hint="Active"
          accent="violet"
          icon={Users}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Both columns are flex with a stretching bottom card so their
          bottom edges align exactly regardless of content height. min-w-0
          keeps either column's intrinsic width from exceeding the phone
          viewport, which would force the whole page to overflow sideways. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#ffb36c]" aria-hidden />
                <h2 className="text-lg font-bold text-[#f8fafc]">Recent Activity</h2>
              </div>
              <Link to="/activity" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
                View all
              </Link>
            </div>
            <ActivityFeed items={data.recentActivity.slice(0, 5)} compact />
          </Card>

          <MyTasksCard tasks={tasks} userId={userId} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-[#ffb36c]" aria-hidden />
                <h2 className="text-lg font-bold text-[#f8fafc]">Project Overview</h2>
              </div>
              <Link to="/reports" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
                View full report
              </Link>
            </div>

            {/* On phones the donut centers and the legend wraps below it at
                full width instead of squeezing beside it. */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
              <DonutChart
                segments={donutSegments}
                centerValue={`${completionPercent}%`}
                centerLabel="Complete"
              />
              <div className="w-full min-w-0 space-y-2.5 sm:w-auto sm:flex-1">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
                  <span>Status</span>
                  <span className="flex gap-6">
                    <span className="w-8 text-right">Projects</span>
                    <span className="w-8 text-right">%</span>
                  </span>
                </div>
                {donutSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#cbd5e1]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden />
                      {segment.label}
                    </span>
                    <span className="flex gap-6 text-[#8e99ad]">
                      <span className="w-8 text-right font-semibold text-[#f8fafc]">{segment.value}</span>
                      <span className="w-8 text-right">
                        {data.totalProjects > 0 ? Math.round((segment.value / data.totalProjects) * 100) : 0}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pp-divider pt-4">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[#cbd5e1]">Overall Progress</span>
                <span className="text-[#f8fafc]">{completionPercent}% complete</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d92d20] via-[#ff7b22] to-[#ffb347] transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#ffb36c]" aria-hidden />
                <h2 className="text-lg font-bold text-[#f8fafc]">Team Members</h2>
              </div>
              <Link to="/teams" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
                Manage Team
              </Link>
            </div>

            <ul className="mt-4 space-y-1.5">
              {topMembers.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => setProfileUserId(member.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
                  >
                    <Avatar
                      name={member.displayName}
                      id={member.id}
                      color={member.avatarColor}
                      presence={presenceFor(member.id, userId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#f8fafc]">{member.displayName}</span>
                      <span className="block truncate text-xs text-[#8e99ad]">{member.email}</span>
                    </span>
                    <span className="shrink-0 text-xs text-[#8e99ad]">
                      {member.assignedTaskCount} task{member.assignedTaskCount === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <Link
              to="/teams"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]"
            >
              View all members
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>

          <UpcomingDeadlinesCard tasks={tasks} />
        </div>
      </div>

      {profileUserId && (
        <MemberProfileDialog
          userId={profileUserId}
          sessionUserId={userId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  )
}
