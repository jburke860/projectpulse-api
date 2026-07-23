import { useState } from 'react'
import { Download, FileText, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { downloadFile } from '../api/client'
import { useWorkspaceAttachments } from '../api/queries'
import type { WorkspaceAttachment } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { FileTypeIcon } from '../components/FileTypeIcon'
import { CardSkeleton } from '../components/Skeleton'
import { Card, PageHeader } from '../components/ui'
import { formatShortDate } from '../lib/dates'

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function downloadUrl(attachment: WorkspaceAttachment) {
  return attachment.taskId
    ? `/api/tasks/${attachment.taskId}/attachments/${attachment.id}/download`
    : `/api/projects/${attachment.projectId}/attachments/${attachment.id}/download`
}

export function DocumentsPage() {
  const { data: attachments = [], isLoading } = useWorkspaceAttachments()
  const [searchText, setSearchText] = useState('')

  const visible = attachments.filter(
    (attachment) =>
      !searchText ||
      `${attachment.fileName} ${attachment.projectName} ${attachment.taskTitle ?? ''}`
        .toLowerCase()
        .includes(searchText.toLowerCase()),
  )

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Files"
        title="Documents"
        description={`${attachments.length} file${attachments.length === 1 ? '' : 's'} shared across the workspace.`}
      />

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687387]"
          aria-hidden
        />
        <input
          type="search"
          aria-label="Search documents"
          placeholder="Search documents..."
          className="pp-input pp-input-icon-left text-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description={
            searchText
              ? 'Try a different file, project, or task name.'
              : 'Files uploaded to projects and tasks will appear here.'
          }
        />
      ) : (
        <>
          {/* Phones get stacked file rows; the five-column table would force
              the whole page wider than the screen. */}
          <Card className="p-2 md:hidden">
            <ul className="divide-y divide-white/[0.06]">
              {visible.map((attachment) => (
                <li key={attachment.id} className="flex items-center gap-3 px-2 py-3">
                  <FileTypeIcon fileName={attachment.fileName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#f8fafc]">{attachment.fileName}</p>
                    <Link
                      to={
                        attachment.taskId
                          ? `/projects/${attachment.projectId}?taskId=${attachment.taskId}`
                          : `/projects/${attachment.projectId}`
                      }
                      className="block truncate text-xs text-[#a9b1c0] transition hover:text-[#ffb36c]"
                    >
                      {attachment.projectName}
                      {attachment.taskTitle ? ` · ${attachment.taskTitle}` : ' · Project files'}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#8e99ad]">
                      {formatFileSize(attachment.sizeBytes)} · {formatShortDate(attachment.createdAtUtc)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Download ${attachment.fileName}`}
                    className="pp-button-ghost min-h-0 shrink-0 p-1.5"
                    onClick={() => {
                      downloadFile(downloadUrl(attachment), attachment.fileName).catch(() =>
                        toast.error(`Could not download "${attachment.fileName}".`),
                      )
                    }}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="hidden overflow-x-auto p-2 md:block">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Location</th>
                  <th className="px-3 py-3 font-semibold">Size</th>
                  <th className="px-3 py-3 font-semibold">Added</th>
                  <th className="px-3 py-3 text-right font-semibold">Download</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((attachment) => (
                  <tr key={attachment.id} className="border-t border-white/[0.06] transition hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon fileName={attachment.fileName} />
                        <span className="max-w-[16rem] truncate font-semibold text-[#f8fafc]">
                          {attachment.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[16rem] px-3 py-3">
                      <Link
                        to={
                          attachment.taskId
                            ? `/projects/${attachment.projectId}?taskId=${attachment.taskId}`
                            : `/projects/${attachment.projectId}`
                        }
                        className="block truncate text-[#a9b1c0] transition hover:text-[#ffb36c]"
                      >
                        {attachment.projectName}
                        {attachment.taskTitle ? ` · ${attachment.taskTitle}` : ' · Project files'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#8e99ad]">
                      {formatFileSize(attachment.sizeBytes)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-[#8e99ad]">
                      {formatShortDate(attachment.createdAtUtc)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Download ${attachment.fileName}`}
                        className="pp-button-ghost min-h-0 p-1.5"
                        onClick={() => {
                          downloadFile(downloadUrl(attachment), attachment.fileName).catch(() =>
                            toast.error(`Could not download "${attachment.fileName}".`),
                          )
                        }}
                      >
                        <Download className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
