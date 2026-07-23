import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../api/queries'
import type { Task } from '../api/types'
import { TaskPreviewDialog } from '../components/TaskPreviewDialog'
import { Card, PageHeader } from '../components/ui'
import { dateKey, getMonthGrid, isSameDay, monthLabel } from '../lib/calendar'
import { isTaskOverdue } from '../lib/tasks'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusColors: Record<string, string> = {
  Open: '#94a3b8',
  InProgress: '#ff7b22',
  InReview: '#eab308',
  Done: '#22c55e',
  Cancelled: '#64748b',
}

function taskColor(task: Task) {
  if (isTaskOverdue(task)) return '#ef4444'
  return statusColors[task.status] ?? '#94a3b8'
}

export function CalendarPage() {
  const { data: tasks = [] } = useTasks()
  const [today] = useState(() => new Date())
  const [view, setView] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }))
  const [previewTask, setPreviewTask] = useState<Task | null>(null)

  const tasksByDay = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.dueDateUtc) continue
    const key = dateKey(new Date(task.dueDateUtc))
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task])
  }

  const grid = getMonthGrid(view.year, view.month)
  const dueThisMonth = grid.reduce(
    (count, day) =>
      day.getMonth() === view.month ? count + (tasksByDay.get(dateKey(day))?.length ?? 0) : count,
    0,
  )

  // Phone agenda: only this month's days that have something scheduled.
  const agendaDays = grid
    .filter((day) => day.getMonth() === view.month)
    .map((day) => ({ day, dayTasks: tasksByDay.get(dateKey(day)) ?? [] }))
    .filter(({ dayTasks }) => dayTasks.length > 0)

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description={`${dueThisMonth} task${dueThisMonth === 1 ? '' : 's'} due in ${monthLabel(view.year, view.month)}.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="pp-button-secondary min-h-0 p-2"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
              className="pp-button-secondary min-h-0 px-3 py-2 text-sm"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="pp-button-secondary min-h-0 p-2"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        }
      />

      <Card className="overflow-hidden p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[#f8fafc]">{monthLabel(view.year, view.month)}</h2>

        {/* Phones get an agenda list: seven ~50px columns are unreadable, so
            the month grid only renders from md up. */}
        <div className="mt-4 space-y-5 md:hidden">
          {agendaDays.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-[#8e99ad]">
              Nothing is due in {monthLabel(view.year, view.month)}.
            </p>
          ) : (
            agendaDays.map(({ day, dayTasks }) => {
              const isToday = isSameDay(day, today)

              return (
                <div key={day.toISOString()}>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#8e99ad]">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? 'bg-[#ff7b22] text-[#1a1005]' : 'bg-white/[0.06] text-[#a9b1c0]'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {weekdays[day.getDay()]}
                    {isToday && <span className="font-semibold text-[#ffb36c]">Today</span>}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {dayTasks.map((task) => {
                      const color = taskColor(task)

                      return (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => setPreviewTask(task)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[#e2e8f0] transition hover:brightness-125"
                            style={{ backgroundColor: `${color}24` }}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate">{task.title}</span>
                            <span className="max-w-[45%] shrink-0 truncate text-xs text-[#8e99ad]">
                              {task.projectName}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-4 hidden grid-cols-7 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] md:grid">
          {weekdays.map((day) => (
            <div
              key={day}
              className="bg-[#0d1118] px-2 py-2 text-center text-[0.65rem] font-bold uppercase tracking-wide text-[#8e99ad]"
            >
              {day}
            </div>
          ))}
          {grid.map((day) => {
            const inMonth = day.getMonth() === view.month
            const isToday = isSameDay(day, today)
            const dayTasks = tasksByDay.get(dateKey(day)) ?? []
            const shown = dayTasks.slice(0, 3)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 bg-[#0d1118] p-1.5 sm:min-h-28 ${inMonth ? '' : 'opacity-40'}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? 'bg-[#ff7b22] text-[#1a1005]' : 'text-[#a9b1c0]'
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {shown.map((task) => {
                    const color = taskColor(task)

                    return (
                      <button
                        key={task.id}
                        type="button"
                        title={`${task.title} · ${task.projectName}`}
                        onClick={() => setPreviewTask(task)}
                        className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[0.7rem] font-medium text-[#e2e8f0] transition hover:brightness-125"
                        style={{ backgroundColor: `${color}24` }}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        <span className="truncate">{task.title}</span>
                      </button>
                    )
                  })}
                  {dayTasks.length > shown.length && (
                    <p className="px-1.5 text-[0.65rem] font-semibold text-[#8e99ad]">
                      +{dayTasks.length - shown.length} more
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#8e99ad]">
          {[
            ['Open', statusColors.Open],
            ['In Progress', statusColors.InProgress],
            ['In Review', statusColors.InReview],
            ['Done', statusColors.Done],
            ['Overdue', '#ef4444'],
          ].map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <TaskPreviewDialog task={previewTask} onClose={() => setPreviewTask(null)} />
    </div>
  )
}
