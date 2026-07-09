import type { AuditLog } from '../api/types'

export function actionLabel(action: string) {
  return action.replace(/([A-Z])/g, ' $1').trim()
}

export function isCommentActivity(item: AuditLog) {
  return item.action === 'CommentAdded'
}
