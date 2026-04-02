export default function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs">N/A</span>
  const color = score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{score}</span>
}
