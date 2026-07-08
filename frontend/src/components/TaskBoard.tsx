import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Paperclip } from 'lucide-react'
import { useBoardStatusChange } from '../api/queries'
import type { Task } from '../api/types'
import { canTransition, formatTaskStatus } from '../lib/tasks'
import { cn } from '../lib/cn'
import { LabelChip } from './LabelChip'
import { Badge } from './ui'

const boardColumns = ['Open', 'InProgress', 'InReview', 'Done'] as const

const COLUMN_ATTRIBUTE = 'data-board-column'

// dnd-kit's droppable measuring misbehaves with React 19, so drop targets are
// resolved by hit-testing the live pointer position against column rects.
function columnAtPoint(point: { x: number; y: number } | null): string | null {
  if (!point) return null

  for (const element of document.querySelectorAll(`[${COLUMN_ATTRIBUTE}]`)) {
    const rect = element.getBoundingClientRect()
    if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
      return element.getAttribute(COLUMN_ATTRIBUTE)
    }
  }

  return null
}

interface TaskBoardProps {
  tasks: Task[]
  projectId: string
  onSelectTask: (taskId: string) => void
}

export function TaskBoard({ tasks, projectId, onSelectTask }: TaskBoardProps) {
  const changeStatus = useBoardStatusChange(projectId)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overStatus, setOverStatus] = useState<string | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  useEffect(() => {
    if (!activeTask) return

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      setOverStatus(columnAtPoint(pointerRef.current))
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [activeTask])

  const handleDragStart = (event: DragStartEvent) => {
    const activator = event.activatorEvent as PointerEvent
    if (typeof activator?.clientX === 'number') {
      pointerRef.current = { x: activator.clientX, y: activator.clientY }
    }
    setActiveTask(tasks.find((task) => task.id === event.active.id) ?? null)
  }

  const handleDragEnd = () => {
    const task = activeTask
    const targetStatus = columnAtPoint(pointerRef.current)
    setActiveTask(null)
    setOverStatus(null)
    pointerRef.current = null

    if (!task || !targetStatus || targetStatus === task.status) return
    if (!canTransition(task.status, targetStatus)) return

    changeStatus.mutate({ taskId: task.id, status: targetStatus })
  }

  const handleDragCancel = () => {
    setActiveTask(null)
    setOverStatus(null)
    pointerRef.current = null
  }

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {boardColumns.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks.filter((task) => task.status === status)}
            activeTask={activeTask}
            isOver={overStatus === status}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <BoardCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

interface BoardColumnProps {
  status: (typeof boardColumns)[number]
  tasks: Task[]
  activeTask: Task | null
  isOver: boolean
  onSelectTask: (taskId: string) => void
}

function BoardColumn({ status, tasks, activeTask, isOver, onSelectTask }: BoardColumnProps) {
  const isValidTarget = !activeTask || canTransition(activeTask.status, status)

  return (
    <div
      {...{ [COLUMN_ATTRIBUTE]: status }}
      className={cn(
        'flex min-h-[14rem] flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition',
        activeTask && !isValidTarget && 'opacity-40',
        isOver && isValidTarget && 'border-[#ff7b22]/55 bg-[#ff7b22]/[0.06]',
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-bold text-[#f8fafc]">{formatTaskStatus(status)}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-xs font-semibold text-[#a9b1c0]">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <DraggableBoardCard key={task.id} task={task} onSelectTask={onSelectTask} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-[#687387]">
            No tasks
          </p>
        )}
      </div>
    </div>
  )
}

function DraggableBoardCard({ task, onSelectTask }: { task: Task; onSelectTask: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onSelectTask(task.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelectTask(task.id)
      }}
      className={cn('cursor-grab touch-none', isDragging && 'opacity-30')}
    >
      <BoardCard task={task} />
    </div>
  )
}

function BoardCard({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const fileSummary =
    task.attachmentCount === 1
      ? task.attachmentFileNames[0] ?? '1 file attached'
      : task.attachmentCount > 1
        ? `${task.attachmentCount} files attached`
        : null

  return (
    <div className={cn('pp-card p-3', isOverlay && 'rotate-2 shadow-2xl')}>
      <p className="text-sm font-semibold leading-5 text-[#f8fafc]">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={task.priority === 'Critical' || task.priority === 'High' ? 'red' : 'neutral'}>
          {task.priority}
        </Badge>
        {task.labels.slice(0, 3).map((label) => (
          <LabelChip key={label.id} label={label} />
        ))}
      </div>
      {fileSummary && (
        <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-medium text-[#ffb36c]">
          <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{fileSummary}</span>
        </p>
      )}
      <p className="mt-2 truncate text-xs text-[#8e99ad]">{task.assigneeName ?? 'Unassigned'}</p>
    </div>
  )
}
