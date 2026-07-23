import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { UserRound } from 'lucide-react'
import { useUpdateProfile } from '../api/queries'
import { getMutationErrorMessage } from '../lib/errors'
import { lightenColor, projectColorOptions } from '../lib/projectIcons'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { Avatar } from './Avatar'
import { Button } from './ui'

interface ProfileDialogProps {
  userId: string
  name: string
  email: string
  avatarColor: string | null
  onClose: () => void
}

export function ProfileDialog({ userId, name, email, avatarColor, onClose }: ProfileDialogProps) {
  const updateProfile = useUpdateProfile()
  const [displayName, setDisplayName] = useState(name)
  const [color, setColor] = useState<string | null>(avatarColor)
  useEscapeToClose(onClose)

  const mutationError = getMutationErrorMessage(updateProfile.error)
  const trimmed = displayName.trim()
  const canSave = trimmed.length > 0 && !updateProfile.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    updateProfile.mutate(
      { displayName: trimmed, ...(color ? { avatarColor: color } : {}) },
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
        aria-label="Close profile"
        onClick={onClose}
      />
      <aside className="pp-card pp-dialog-enter fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pp-divider pb-4">
          <div>
            <p className="pp-eyebrow">Account</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#f8fafc]">
              <UserRound className="h-4 w-4 text-[#ffb36c]" aria-hidden />
              Edit profile
            </h2>
          </div>
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {mutationError && (
            <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
              {mutationError}
            </p>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <Avatar name={trimmed || name} id={userId || name} color={color} size="md" presence="online" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#f8fafc]">{trimmed || name}</p>
              <p className="truncate text-xs text-[#8e99ad]">How you appear across the workspace</p>
            </div>
          </div>

          <label className="pp-label">
            Display name
            <input
              required
              maxLength={100}
              className="pp-input text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <div className="pp-label">
            Avatar color
            <div role="radiogroup" aria-label="Avatar color" className="flex flex-wrap items-center gap-2">
              {projectColorOptions.map((option) => {
                const selected = option === color

                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Avatar color ${option}`}
                    onClick={() => setColor(option)}
                    className={`h-8 w-8 rounded-full border transition ${
                      selected
                        ? 'border-white/70 ring-2 ring-white/30 ring-offset-2 ring-offset-[#0a0d13]'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${option}, ${lightenColor(option)})` }}
                  />
                )
              })}
            </div>
          </div>

          <label className="pp-label">
            Email
            <input className="pp-input text-sm" value={email} disabled readOnly />
          </label>
          <p className="text-xs leading-5 text-[#687387]">
            The email is fixed for this demo session. Renaming updates your name on tasks, comments,
            and activity.
          </p>

          <div className="flex justify-end gap-3 border-t pp-divider pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </aside>
    </>,
    document.body,
  )
}
