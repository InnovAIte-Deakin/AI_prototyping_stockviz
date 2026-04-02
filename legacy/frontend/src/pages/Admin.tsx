import api from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

function useEndpoint<T>(url: string) {
  return useQuery({
    queryKey: ['admin', url],
    queryFn: async () => (await api.get<T>(url)).data,
    refetchOnWindowFocus: false
  })
}

export default function Admin() {
  const health = useEndpoint('/health')
  const keys = useEndpoint('/test-keys')
  const conn = useEndpoint('/test-connections')
  const cache = useEndpoint('/cache/status')
  const [isClearing, setIsClearing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  async function clearCache() {
    setIsClearing(true)
    try {
      await api.post('/cache/clear')
      cache.refetch()
    } finally {
      setIsClearing(false)
    }
  }
  
  async function cleanupCache() {
    setIsCleaning(true)
    try {
      await api.post('/cache/cleanup')
      cache.refetch()
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System Diagnostics</h1>

      <div className="prose max-w-none">
        <p className="text-slate-600">
          Monitor system health, API connections, and cache status. 
          Use cache management tools to optimize performance.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6">
        <div className="border rounded-md p-4 bg-white">
          <h2 className="text-lg font-medium mb-3">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Status</div>
              <div className="font-medium">{health.data?.status || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Environment</div>
              <div className="font-medium">{health.data?.environment || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Uptime</div>
              <div className="font-medium">{health.data?.uptime ? `${health.data.uptime.toFixed(2)} seconds` : 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Timestamp</div>
              <div className="font-medium">{health.data?.timestamp || 'Unknown'}</div>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-white">
          <h2 className="text-lg font-medium mb-3">API Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Alpha Vantage</div>
              <div className={`font-medium ${keys.data?.alpha_vantage_configured ? 'text-green-600' : 'text-red-600'}`}>
                {keys.data?.alpha_vantage_configured ? 'Configured' : 'Not Configured'}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Gemini AI</div>
              <div className={`font-medium ${keys.data?.gemini_configured ? 'text-green-600' : 'text-red-600'}`}>
                {keys.data?.gemini_configured ? 'Configured' : 'Not Configured'}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-slate-600">Ready for Development</div>
              <div className={`font-medium ${keys.data?.ready_for_development ? 'text-green-600' : 'text-red-600'}`}>
                {keys.data?.ready_for_development ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-white">
          <h2 className="text-lg font-medium mb-3">API Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600">Alpha Vantage</div>
              <div className={`font-medium ${conn.data?.alpha_vantage?.ready ? 'text-green-600' : 'text-red-600'}`}>
                {conn.data?.alpha_vantage?.status || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Gemini AI</div>
              <div className={`font-medium ${conn.data?.gemini?.ready ? 'text-green-600' : 'text-red-600'}`}>
                {conn.data?.gemini?.status || 'Unknown'}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-slate-600">Overall Status</div>
              <div className={`font-medium ${conn.data?.overall_status === 'ready' ? 'text-green-600' : 'text-red-600'}`}>
                {conn.data?.overall_status || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-white">
          <h2 className="text-lg font-medium mb-3">Cache Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="border rounded p-3">
              <div className="text-sm text-slate-600">Total Items</div>
              <div className="font-medium">{cache.data?.cache?.total || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-slate-600">Valid Items</div>
              <div className="font-medium text-green-600">{cache.data?.cache?.valid || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-slate-600">Expired Items</div>
              <div className="font-medium text-red-600">{cache.data?.cache?.expired || 0}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-50"
              onClick={clearCache}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
            <button 
              className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-50"
              onClick={cleanupCache}
              disabled={isCleaning}
            >
              {isCleaning ? 'Cleaning...' : 'Clean Expired Entries'}
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Clearing removes all cached data. Cleaning removes only expired entries.
          </div>
        </div>
      </section>
    </div>
  )
}
