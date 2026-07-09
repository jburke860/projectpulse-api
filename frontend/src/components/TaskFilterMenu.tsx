import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { Label } from '../api/types'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { formatTaskStatus, taskPriorities, taskStatuses } from '../lib/tasks'
import { emptyTaskFilters, type TaskFilterValues } from '../lib/taskFilters'

interface TaskFilterMenuProps {
  filters: TaskFilterValues
  assignees: { userId: string; displayName: string }[]
  labels: Label[]
  onChange: (filters: TaskFilterValues) => void
}

export function TaskFilterMenu({ filters, assignees, labels, onChange }: TaskFilterMenuProps) {
  const [open, setOpen] = useState(false)
  useEscapeToClose(() => setOpen(false), open)

  const activeCount = [filters.status, filters.priority, filters.assigneeId, filters.labelId].filter(
    Boolean,
  ).length

  const set = (patch: Partial<TaskFilterValues>) => onChange({ ...filters, ...patch })

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
          activeCount > 0
            ? 'border-[#ff7b22]/45 bg-[#ff7b22]/10 text-[#fff7ed]'
            : 'border-white/10 bg-white/[0.03] text-[#a9b1c0] hover:text-[#f8fafc]'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-[#ff7b22] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#1a1005]">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="pp-card absolute right-0 top-full z-50 mt-2 w-72 space-y-4 p-4 shadow-2xl">
            <label className="pp-label">
              Status
              <select
                className="pp-select text-sm"
                value={filters.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                <option value="">All statuses</option>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatTaskStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="pp-label">
              Priority
              <select
                className="pp-select text-sm"
                value={filters.priority}
                onChange={(e) => set({ priority: e.target.value })}
              >
                <option value="">All priorities</option>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="pp-label">
              Assignee
              <select
                className="pp-select text-sm"
                value={filters.assigneeId}
                onChange={(e) => set({ assigneeId: e.target.value })}
              >
                <option value="">All assignees</option>
                {assignees.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </label>

            {labels.length > 0 && (
              <label className="pp-label">
                Label
                <select
                  className="pp-select text-sm"
                  value={filters.labelId}
                  onChange={(e) => set({ labelId: e.target.value })}
                >
                  <option value="">All labels</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex items-center justify-between border-t pp-divider pt-3">
              <button
                type="button"
                disabled={activeCount === 0}
                className="pp-button-ghost min-h-0 px-2 py-1 text-xs disabled:opacity-40"
                onClick={() => onChange(emptyTaskFilters)}
              >
                Clear all
              </button>
              <button
                type="button"
                className="pp-button-secondary min-h-0 px-3 py-1.5 text-xs"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
