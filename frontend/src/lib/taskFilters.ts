export interface TaskFilterValues {
  status: string
  priority: string
  assigneeId: string
  labelId: string
}

export const emptyTaskFilters: TaskFilterValues = {
  status: '',
  priority: '',
  assigneeId: '',
  labelId: '',
}
