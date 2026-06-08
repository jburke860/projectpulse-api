interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  accent?: 'ember' | 'amber' | 'sunset' | 'rose'
}

const accents = {
  ember: 'border-[#ff7b22]/35 bg-[#ff7b22]/10 text-[#ffd2b3]',
  amber: 'border-[#ffb347]/35 bg-[#ffb347]/10 text-[#ffe0b5]',
  sunset: 'border-[#d92d20]/35 bg-[#d92d20]/10 text-[#ffc2b9]',
  rose: 'border-[#ff5a1f]/35 bg-[#ff5a1f]/10 text-[#ffd0c1]',
}

export function StatCard({ label, value, hint, accent = 'ember' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-[0_14px_40px_rgba(0,0,0,0.24)] ${accents[accent]}`}>
      <p className="text-sm text-[#efc9bd]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#fff8f4]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#cf9f90]">{hint}</p>}
    </div>
  )
}
