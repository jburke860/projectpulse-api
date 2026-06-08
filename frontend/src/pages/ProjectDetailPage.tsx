import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAddProjectMember,
  useCreateTask,
  useDeleteProject,
  useProject,
  useProjectActivity,
  useProjectMembers,
  useProjectSummary,
  useRemoveProjectMember,
  useTasks,
  useUsers,
} from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { TaskPanel } from '../components/TaskPanel'

const statusColors: Record<string, string> = {
  Open: 'border border-[#5a1914] bg-[#24100d] text-[#fff0e8]',
  InProgress: 'border border-[#ff7b22]/30 bg-[#ff7b22]/12 text-[#ffd2b3]',
  InReview: 'border border-[#ffb347]/30 bg-[#ffb347]/12 text-[#ffe1b0]',
  Done: 'border border-[#d92d20]/30 bg-[#d92d20]/12 text-[#ffc7bf]',
  Cancelled: 'border border-[#ff5a1f]/30 bg-[#ff5a1f]/12 text-[#ffd0c1]',
}

const memberRoles = ['Member', 'Viewer', 'Admin']

function getMutationErrorMessage(error: unknown) {
  if (!error) return null

  const response = (error as {
    response?: { data?: { errors?: string[]; message?: string } }
  }).response

  if (response?.data?.errors?.length) {
    return response.data.errors.join(' ')
  }

  if (response?.data?.message) {
    return response.data.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: project } = useProject(id)
  const { data: summary } = useProjectSummary(id)
  const { data: members = [] } = useProjectMembers(id)
  const { data: users = [] } = useUsers()
  const { data: tasks = [] } = useTasks(id)
  const { data: activity = [] } = useProjectActivity(id)
  const createTask = useCreateTask(id)
  const deleteProject = useDeleteProject()
  const addMember = useAddProjectMember(id)
  const removeMember = useRemoveProjectMember(id)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState('Member')

  if (!project) {
    return <p className="text-[#d8a290]">Loading project…</p>
  }

  const progress =
    summary && summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0
  const memberIds = new Set(members.map((member) => member.userId))
  const availableUsers = users.filter((user) => !memberIds.has(user.id))
  const adminCount = members.filter((member) => member.role === 'Admin').length
  const memberMutationError = getMutationErrorMessage(addMember.error ?? removeMember.error)

  const handleDeleteProject = () => {
    const confirmed = window.confirm(
      `Delete "${project.name}" and all of its tasks? This cannot be undone.`,
    )

    if (confirmed) {
      deleteProject.mutate(project.id, {
        onSuccess: () => navigate('/projects'),
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="text-sm text-[#ffb15f] hover:text-[#ffd2b3]">
            ← Back to projects
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-[#fff6f2]">{project.name}</h2>
          <p className="mt-1 text-[#d8a290]">{project.description}</p>
        </div>
        <button
          type="button"
          disabled={deleteProject.isPending}
          onClick={handleDeleteProject}
          className="rounded-lg border border-[#ff5a1f]/45 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete project
        </button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ['Total', summary.totalTasks],
            ['Open', summary.openTasks],
            ['In progress', summary.inProgressTasks],
            ['Done', summary.doneTasks],
            ['Overdue', summary.overdueTasks],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-[#5b1714] bg-[#230907]/85 p-3 text-center">
              <p className="text-xs text-[#c99182]">{label}</p>
              <p className="text-xl font-bold text-[#fff6f2]">{value as number}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#d8a290]">Progress</span>
          <span className="text-[#fff6f2]">{progress}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#35100c]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d92d20] via-[#ff7b22] to-[#ffb347] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#fff6f2]">Tasks</h3>
          </div>

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!taskAssigneeId) return
              createTask.mutate(
                { title: taskTitle.trim(), priority: taskPriority, assigneeId: taskAssigneeId },
                {
                  onSuccess: () => {
                    setTaskTitle('')
                    setTaskAssigneeId('')
                  },
                },
              )
            }}
          >
            <input
              required
              placeholder="New task title"
              className="min-w-[200px] flex-1 rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <select
              required
              aria-label="Assignee"
              className="min-w-[160px] rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
            >
              <option value="" disabled>
                Assign to
              </option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
            >
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e]"
            >
              Add task
            </button>
          </form>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#5b1714] bg-[#230907]/85 px-4 py-3 text-left hover:border-[#ff7b22]/45 hover:bg-[#2a0d0a]"
                >
                  <div>
                    <p className="font-medium text-[#fff6f2]">{task.title}</p>
                    <p className="text-xs text-[#c99182]">
                      {task.assigneeName ?? 'Unassigned'} · {task.priority}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[task.status] ?? statusColors.Open}`}>
                    {task.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-4">
            <h3 className="font-semibold text-[#fff6f2]">Members</h3>
            {memberMutationError && (
              <p className="mt-3 rounded-lg border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-2 text-sm text-[#ffd1c4]">
                {memberMutationError}
              </p>
            )}
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!memberUserId) return
                addMember.mutate(
                  { userId: memberUserId, role: memberRole },
                  { onSuccess: () => setMemberUserId('') },
                )
              }}
            >
              <select
                required
                aria-label="User"
                className="w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                disabled={availableUsers.length === 0}
              >
                <option value="" disabled>
                  Add person
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  className="min-w-0 flex-1 rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  {memberRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!memberUserId || addMember.isPending}
                  className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-3 py-2 text-sm font-medium text-white hover:from-[#e03a21] hover:to-[#ff9a2e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </form>
            <ul className="mt-4 space-y-2">
              {members.map((m) => (
                <li key={m.userId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-[#fff0e8]">{m.displayName}</p>
                    <p className="truncate text-xs text-[#c99182]">
                      {m.role} · {m.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={removeMember.isPending || (m.role === 'Admin' && adminCount <= 1)}
                    onClick={() => removeMember.mutate(m.userId)}
                    className="shrink-0 rounded-md border border-[#ff5a1f]/35 px-2 py-1 text-xs font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-4">
            <h3 className="font-semibold text-[#fff6f2]">Recent activity</h3>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <ActivityFeed items={activity.slice(0, 5)} compact />
            </div>
          </section>
        </div>
      </div>

      {selectedTaskId && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
            aria-label="Close task panel"
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskPanel taskId={selectedTaskId} projectId={id} onClose={() => setSelectedTaskId(null)} />
        </>
      )}
    </div>
  )
}
