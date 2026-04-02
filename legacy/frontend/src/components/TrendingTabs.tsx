import { useState } from 'react'
import { useTrending } from '../lib/queries'
import { TrendingResponse } from '../lib/types'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

const tabs = ['gainers', 'losers', 'mostActive'] as const

function getTrendingData(data: TrendingResponse | undefined, tab: typeof tabs[number]) {
  if (!data?.trending) return []

  // If data.trending is an array, it's a single-category response
  if (Array.isArray(data.trending)) {
    return data.trending
  }

  // If data.trending is an object, get the data for the current tab
  if (typeof data.trending === 'object' && data.trending[tab]) {
    return data.trending[tab] ?? []
  }
  
  return []
}

export default function TrendingTabs() {
  const [tab, setTab] = useState<typeof tabs[number]>('gainers')
  const { data, isLoading } = useTrending(tab)

  return (
    <div>
      <div className="inline-flex rounded-md border bg-white">
        {tabs.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${t===tab ? 'bg-slate-100' : ''}`}
          >{t}</button>
        ))}
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-500">Loading trending stocks...</span>
          </div>
        ) : data && getTrendingData(data, tab).length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {getTrendingData(data, tab).map((it) => (
              <div key={it.symbol} className="border rounded-md p-3 bg-white hover:shadow-md transition-shadow cursor-pointer">
                <div className="font-medium">{it.symbol}</div>
                <div className="text-sm text-slate-500 truncate">{it.name}</div>
                <div className="text-sm mt-1">
                  <span className="font-medium">${it.price?.toFixed(2) ?? '—'}</span>
                  {it.change != null && (
                    <span className={`ml-2 ${it.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {it.change >= 0 ? '+' : ''}{it.change.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No trending data available"
            description="Unable to load trending stocks at this time"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  )
}
