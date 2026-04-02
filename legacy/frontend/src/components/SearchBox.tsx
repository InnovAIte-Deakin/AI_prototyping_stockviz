import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../lib/queries'
import LoadingSpinner from './LoadingSpinner'

export default function SearchBox() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])
  const { data, isLoading } = useSearch(debounced)
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          className="w-full rounded-md border px-3 py-2 pr-10 text-lg"
          placeholder="Search for a symbol (e.g., AAPL, TSLA)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      {debounced && (
        <div className="mt-2 border rounded-md bg-white max-h-64 overflow-auto shadow-lg">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-slate-500">
              <LoadingSpinner size="sm" className="mx-auto mb-2" />
              <div className="text-sm">Searching...</div>
            </div>
          ) : data?.results?.length ? (
            data.results.map((r) => (
              <button
                key={r.symbol}
                onClick={() => {
                  navigate(`/symbol/${encodeURIComponent(r.symbol)}`)
                  setQ('')
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b last:border-b-0"
              >
                <div className="font-medium">{r.symbol}</div>
                <div className="text-xs text-slate-500 truncate">{r.name ?? r.type ?? ''}</div>
                {r.region && <div className="text-xs text-slate-400">{r.region}</div>}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-slate-500 text-sm">
              No results found for "{debounced}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
