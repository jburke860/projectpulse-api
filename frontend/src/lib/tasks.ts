export const taskStatuses = ['Open', 'InProgress', 'InReview', 'Done', 'Cancelled'] as const
export const taskPriorities = ['Low', 'Medium', 'High', 'Critical'] as const

export type TaskStatus = (typeof taskStatuses)[number]

// Mirrors TaskStatusTransitionRules on the API; the server enforces these regardless.
export const allowedStatusTransitions: Record<string, string[]> = {
  Open: ['Open', 'InProgress', 'Cancelled'],
  InProgress: ['InProgress', 'InReview', 'Open', 'Cancelled'],
  InReview: ['InReview', 'Done', 'InProgress', 'Cancelled'],
  Done: ['Done'],
  Cancelled: ['Cancelled', 'Open'],
}

export const taskStatusTones: Record<string, 'neutral' | 'orange' | 'yellow' | 'green' | 'red'> = {
  Open: 'neutral',
  InProgress: 'orange',
  InReview: 'yellow',
  Done: 'green',
  Cancelled: 'red',
}

const taskStatusLabels: Record<string, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  InReview: 'In Review',
  Done: 'Done',
  Cancelled: 'Cancelled',
}

export function formatTaskStatus(status: string) {
  return taskStatusLabels[status] ?? status
}

export function canTransition(from: string, to: string) {
  return from === to || (allowedStatusTransitions[from] ?? []).includes(to)
}
