export default function AISummary({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="font-medium mb-1">AI Insights</div>
      <p className="text-sm leading-6 whitespace-pre-wrap">{text}</p>
    </div>
  )
}
