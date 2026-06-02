interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  accent?: 'indigo' | 'amber' | 'emerald' | 'rose'
}

const accents = {
  indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

export function StatCard({ label, value, hint, accent = 'indigo' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accents[accent]}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
