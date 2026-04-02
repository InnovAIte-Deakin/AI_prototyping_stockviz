type Headline = { title?: string, publisher?: string, score?: string | number }
export default function HeadlineList({ items }: { items?: Headline[] }) {
  if (!items?.length) return null
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="font-medium mb-1">Headlines</div>
      <ul className="text-sm space-y-1">
        {items.map((h, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span>{h.title}</span>
            <span className="text-xs text-slate-500">{h.publisher} {h.score != null && `• ${h.score}`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
