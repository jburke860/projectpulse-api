import { AlertTriangle, BarChart3, FolderKanban, PieChart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useProjects, useTasks } from '../api/queries'
import type { Task } from '../api/types'
import { DonutChart, type DonutSegment } from '../components/DonutChart'
import { CardSkeleton } from '../components/Skeleton'
import { TaskPreviewDialog } from '../components/TaskPreviewDialog'
import { Badge, Card, PageHeader } from '../components/ui'
import { formatShortDate } from '../lib/dates'
import { formatTaskStatus, isTaskOverdue, taskPriorityTones, taskPriorities } from '../lib/tasks'

const taskStatusColors: Record<string, string> = {
  Open: '#94a3b8',
  InProgress: '#ff7b22',
  InReview: '#eab308',
  Done: '#22c55e',
  Cancelled: '#64748b',
}

const priorityColors: Record<string, string> = {
  Low: '#94a3b8',
  Medium: '#eab308',
  High: '#ff7b22',
  Critical: '#ef4444',
}

export function ReportsPage() {
  const [previewTask, setPreviewTask] = useState<Task | null>(null)
  const { data: dashboard, isLoading } = useDashboard()
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks()

  if (isLoading || !dashboard) {
    return (
      <div className="pp-page-shell">
        <PageHeader eyebrow="Insights" title="Reports" description="Delivery health across the workspace." />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    )
  }

  const statusSegments: DonutSegment[] = dashboard.tasksByStatus.map((entry) => ({
    label: formatTaskStatus(entry.status),
    value: entry.count,
    color: taskStatusColors[entry.status] ?? '#64748b',
  }))
  const completionPercent = dashboard.totalTasks > 0
    ? Math.round(((dashboard.tasksByStatus.find((s) => s.status === 'Done')?.count ?? 0) / dashboard.totalTasks) * 100)
    : 0

  const byProject = projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id)
      const done = projectTasks.filter((task) => task.status === 'Done').length
      const percent = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0
      return { project, total: projectTasks.length, done, percent }
    })
    .sort((a, b) => b.percent - a.percent)

  const byPriority = taskPriorities.map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length,
  }))
  const maxPriorityCount = Math.max(1, ...byPriority.map((entry) => entry.count))

  const overdueTasks = tasks
    .filter((task) => isTaskOverdue(task))
    .sort((a, b) => new Date(a.dueDateUtc ?? 0).getTime() - new Date(b.dueDateUtc ?? 0).getTime())

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description={`${dashboard.totalTasks} tasks across ${dashboard.totalProjects} projects, ${completionPercent}% complete overall.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            <h2 className="text-lg font-bold text-[#f8fafc]">Tasks by Status</h2>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <DonutChart segments={statusSegments} centerValue={`${completionPercent}%`} centerLabel="Complete" />
            <div className="min-w-0 flex-1 space-y-2.5">
              {statusSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#cbd5e1]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden />
                    {segment.label}
                  </span>
                  <span className="flex gap-6 text-[#8e99ad]">
                    <span className="w-8 text-right font-semibold text-[#f8fafc]">{segment.value}</span>
                    <span className="w-10 text-right">
                      {dashboard.totalTasks > 0 ? Math.round((segment.value / dashboard.totalTasks) * 100) : 0}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            <h2 className="text-lg font-bold text-[#f8fafc]">Tasks by Priority</h2>
          </div>
          <div className="mt-5 space-y-4">
            {byPriority.map(({ priority, count }) => (
              <div key={priority}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#cbd5e1]">{priority}</span>
                  <span className="font-semibold text-[#f8fafc]">{count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((count / maxPriorityCount) * 100)}%`,
                      backgroundColor: priorityColors[priority],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-[#ffb36c]" aria-hidden />
          <h2 className="text-lg font-bold text-[#f8fafc]">Progress by Project</h2>
        </div>
        <div className="mt-5 space-y-4">
          {byProject.map(({ project, total, done, percent }) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-[#f8fafc] transition hover:text-[#ffb36c]">
                  {project.name}
                </span>
                <span className="shrink-0 text-xs text-[#8e99ad]">
                  {done}/{total} done · {percent}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d92d20] via-[#ff7b22] to-[#ffb347] transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#fca5a5]" aria-hidden />
          <h2 className="text-lg font-bold text-[#f8fafc]">Overdue Tasks</h2>
        </div>
        {overdueTasks.length === 0 ? (
          <p className="mt-4 text-sm text-[#8e99ad]">Nothing is overdue. Great job!</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
                  <th className="pb-2 pr-3 font-semibold">Task</th>
                  <th className="pb-2 pr-3 font-semibold">Project</th>
                  <th className="pb-2 pr-3 font-semibold">Assignee</th>
                  <th className="pb-2 pr-3 font-semibold">Priority</th>
                  <th className="pb-2 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setPreviewTask(task)}
                    className="cursor-pointer border-t border-white/[0.06] transition hover:bg-white/[0.04]"
                  >
                    <td className="max-w-[14rem] truncate py-2.5 pr-3 font-medium text-[#f8fafc]">{task.title}</td>
                    <td className="max-w-[11rem] truncate py-2.5 pr-3 text-[#8e99ad]">{task.projectName}</td>
                    <td className="max-w-[9rem] truncate py-2.5 pr-3 text-[#8e99ad]">
                      {task.assigneeName ?? 'Unassigned'}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={taskPriorityTones[task.priority] ?? 'neutral'}>{task.priority}</Badge>
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-xs font-semibold text-[#fca5a5]">
                      {task.dueDateUtc ? formatShortDate(task.dueDateUtc) : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TaskPreviewDialog task={previewTask} onClose={() => setPreviewTask(null)} />
    </div>
  )
}
