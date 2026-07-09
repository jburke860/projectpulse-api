export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  centerValue: string
  centerLabel?: string
  size?: number
  strokeWidth?: number
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 180,
  strokeWidth = 18,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const visible = segments.filter((segment) => segment.value > 0)
  // Small gap between segments, only when there is more than one.
  const gap = visible.length > 1 ? Math.min(6, circumference * 0.01) : 0

  let cumulative = 0

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth={strokeWidth}
            />
          ) : (
            visible.map((segment) => {
              const length = (segment.value / total) * circumference
              const dash = Math.max(length - gap, 0.5)
              const offset = -cumulative
              cumulative += length

              return (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                >
                  <title>{`${segment.label}: ${segment.value}`}</title>
                </circle>
              )
            })
          )}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[#f8fafc]">{centerValue}</span>
        {centerLabel && <span className="mt-0.5 text-xs text-[#8e99ad]">{centerLabel}</span>}
      </div>
    </div>
  )
}
