import { cn } from '../lib/cn'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  accent?: 'ember' | 'amber' | 'sunset' | 'rose'
}

const accents = {
  ember: {
    icon: 'bg-gradient-to-br from-[#ff5a1f] to-[#ff9f3f] text-white shadow-[0_12px_28px_rgba(255,90,31,0.22)]',
    marker: 'bg-[#ff7b22]',
  },
  amber: {
    icon: 'bg-gradient-to-br from-[#d99a16] to-[#ffcf5c] text-[#201006] shadow-[0_12px_28px_rgba(251,191,36,0.2)]',
    marker: 'bg-[#ffb347]',
  },
  sunset: {
    icon: 'bg-gradient-to-br from-[#22c55e] to-[#86efac] text-[#04130a] shadow-[0_12px_28px_rgba(34,197,94,0.18)]',
    marker: 'bg-[#4ade80]',
  },
  rose: {
    icon: 'bg-gradient-to-br from-[#ef4444] to-[#fb7185] text-white shadow-[0_12px_28px_rgba(239,68,68,0.18)]',
    marker: 'bg-[#fb7185]',
  },
}

const symbols = {
  ember: 'P',
  amber: 'T',
  sunset: 'C',
  rose: '!',
}

export function StatCard({ label, value, hint, accent = 'ember' }: StatCardProps) {
  return (
    <div className="pp-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#a9b1c0]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#f8fafc]">{value}</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black', accents[accent].icon)}>
          {symbols[accent]}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', accents[accent].marker)} />
        <p className="text-xs text-[#7f8a9d]">{hint ?? 'Workspace total'}</p>
      </div>
    </div>
  )
}
