export const projectRoles = ['Admin', 'Member', 'Viewer'] as const

export type ProjectRole = (typeof projectRoles)[number]

export function isAssignableMember(role: string) {
  return role === 'Admin' || role === 'Member'
}
