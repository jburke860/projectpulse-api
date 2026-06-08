import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useCreateTask,
  useDeleteProject,
  useProject,
  useProjectActivity,
  useProjectMembers,
  useProjectSummary,
  useTasks,
} from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { TaskPanel } from '../components/TaskPanel'

const statusColors: Record<string, string> = {
  Open: 'bg-slate-700 text-slate-200',
  InProgress: 'bg-amber-500/20 text-amber-300',
  InReview: 'bg-indigo-500/20 text-indigo-300',
  Done: 'bg-emerald-500/20 text-emerald-300',
  Cancelled: 'bg-rose-500/20 text-rose-300',
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: project } = useProject(id)
  const { data: summary } = useProjectSummary(id)
  const { data: members = [] } = useProjectMembers(id)
  const { data: tasks = [] } = useTasks(id)
  const { data: activity = [] } = useProjectActivity(id)
  const createTask = useCreateTask(id)
  const deleteProject = useDeleteProject()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')

  if (!project) {
    return <p className="text-slate-400">Loading project…</p>
  }

  const progress =
    summary && summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0

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
          <Link to="/projects" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Back to projects
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-white">{project.name}</h2>
          <p className="mt-1 text-slate-400">{project.description}</p>
        </div>
        <button
          type="button"
          disabled={deleteProject.isPending}
          onClick={handleDeleteProject}
          className="rounded-lg border border-rose-500/50 px-4 py-2 text-sm font-medium text-rose-300 hover:border-rose-400 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
            <div key={label as string} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-white">{value as number}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="text-white">{progress}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Tasks</h3>
          </div>

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              createTask.mutate(
                { title: taskTitle, priority: taskPriority },
                { onSuccess: () => setTaskTitle('') },
              )
            }}
          >
            <input
              required
              placeholder="New task title"
              className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <select
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
            >
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">
              Add task
            </button>
          </form>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-left hover:border-indigo-500/40"
                >
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">
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
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-semibold text-white">Members</h3>
            <ul className="mt-3 space-y-2">
              {members.map((m) => (
                <li key={m.userId} className="text-sm">
                  <p className="text-slate-200">{m.displayName}</p>
                  <p className="text-xs text-slate-500">
                    {m.role} · {m.email}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-semibold text-white">Recent activity</h3>
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
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close task panel"
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskPanel taskId={selectedTaskId} projectId={id} onClose={() => setSelectedTaskId(null)} />
        </>
      )}
    </div>
  )
}
