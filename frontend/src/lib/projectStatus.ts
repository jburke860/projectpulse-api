export const projectStatuses = ['Planning', 'Active', 'OnHold', 'Completed'] as const

export type ProjectStatus = (typeof projectStatuses)[number]

export const projectStatusLabels: Record<string, string> = {
  Planning: 'Planning',
  Active: 'Active',
  OnHold: 'On Hold',
  Completed: 'Completed',
}

export const projectStatusTones: Record<string, 'neutral' | 'orange' | 'green' | 'yellow' | 'red'> = {
  Planning: 'yellow',
  Active: 'green',
  OnHold: 'orange',
  Completed: 'neutral',
}

export function formatProjectStatus(status: string) {
  return projectStatusLabels[status] ?? status
}

export function projectStatusTone(status: string) {
  return projectStatusTones[status] ?? 'neutral'
}
