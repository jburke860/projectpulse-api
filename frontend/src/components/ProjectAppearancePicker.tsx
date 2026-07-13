import { lightenColor, projectColorOptions, projectIconOptions } from '../lib/projectIcons'

interface ProjectAppearancePickerProps {
  icon: string
  color: string
  onIconChange: (icon: string) => void
  onColorChange: (color: string) => void
}

export function ProjectAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: ProjectAppearancePickerProps) {
  return (
    <>
      <div className="pp-label">
        Icon
        <div role="radiogroup" aria-label="Project icon" className="flex flex-wrap gap-2">
          {projectIconOptions.map((option) => {
            const selected = option.name === icon
            const OptionIcon = option.icon

            return (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${option.label} icon`}
                title={option.label}
                onClick={() => onIconChange(option.name)}
                className={`flex h-11 w-11 items-center justify-center rounded-[0.85rem] border text-white transition ${
                  selected
                    ? 'border-white/40 ring-2 ring-[#ff7b22]/60 ring-offset-2 ring-offset-[#0a0d13]'
                    : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
                style={{ background: `linear-gradient(135deg, ${color}, ${lightenColor(color)})` }}
              >
                <OptionIcon className="h-5 w-5" aria-hidden />
              </button>
            )
          })}
        </div>
      </div>
      <div className="pp-label">
        Color
        <div role="radiogroup" aria-label="Project color" className="flex flex-wrap items-center gap-2">
          {projectColorOptions.map((option) => {
            const selected = option === color

            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Color ${option}`}
                onClick={() => onColorChange(option)}
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
    </>
  )
}
