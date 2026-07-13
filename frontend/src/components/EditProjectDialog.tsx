import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { FolderPen } from 'lucide-react'
import { useUpdateProject } from '../api/queries'
import type { Project } from '../api/types'
import { getMutationErrorMessage } from '../lib/errors'
import { projectColorOptions, projectIconOptions } from '../lib/projectIcons'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { ProjectAppearancePicker } from './ProjectAppearancePicker'
import { Button } from './ui'

interface EditProjectDialogProps {
  project: Project
  onClose: () => void
}

export function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
  const updateProject = useUpdateProject(project.id)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [icon, setIcon] = useState(project.icon ?? projectIconOptions[0].name)
  const [color, setColor] = useState(project.color ?? projectColorOptions[0])
  useEscapeToClose(onClose)

  const mutationError = getMutationErrorMessage(updateProject.error)
  const canSave = name.trim().length > 0 && !updateProject.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    updateProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        status: project.status,
        icon,
        color,
      },
      { onSuccess: onClose },
    )
  }

  // Portaled to <body> so transformed/filtered ancestors can never hijack
  // the fixed positioning.
  return createPortal(
    <>
      <button
        type="button"
        className="pp-overlay-enter fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close edit project"
        onClick={onClose}
      />
      <aside className="pp-card pp-dialog-enter fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pp-divider p-5">
          <div>
            <p className="pp-eyebrow">Project</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#f8fafc]">
              <FolderPen className="h-4 w-4 text-[#ffb36c]" aria-hidden />
              Edit project
            </h2>
          </div>
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>

        <form className="space-y-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
          {mutationError && (
            <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
              {mutationError}
            </p>
          )}

          <label className="pp-label">
            Project name
            <input
              required
              maxLength={200}
              className="pp-input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="pp-label">
            Description
            <textarea
              rows={3}
              maxLength={1800}
              className="pp-textarea resize-y text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <ProjectAppearancePicker
            icon={icon}
            color={color}
            onIconChange={setIcon}
            onColorChange={setColor}
          />

          <div className="flex justify-end gap-3 border-t pp-divider pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {updateProject.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </aside>
    </>,
    document.body,
  )
}
