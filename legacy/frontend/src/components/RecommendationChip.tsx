export default function RecommendationChip({ rec }: { rec?: string }) {
  const label = rec ?? '—'
  const color = rec === 'BUY' ? 'bg-green-600' : rec === 'HOLD' ? 'bg-yellow-600' : rec === 'SELL' ? 'bg-red-600' : 'bg-slate-500'
  return <span className={`px-2 py-1 rounded-full text-white text-xs ${color}`}>{label}</span>
}
