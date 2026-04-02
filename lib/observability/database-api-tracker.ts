/**
 * Database-backed API tracker using Supabase.
 * Replaces the in-memory ApiTracker for production readiness.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ApiCallEntry {
  id?: number
  api_name: string
  endpoint: string
  symbol: string | null
  timeframe: string | null
  success: boolean
  response_time: number
  created_at?: string
}

export interface ApiStats {
  totalCalls: number
  apis: Record<
    string,
    {
      total: number
      successful: number
      failed: number
      averageResponseTime: number
    }
  >
  recentCalls: ApiCallEntry[]
}

// Rate limit for cleanup - only run once per minute
const CLEANUP_INTERVAL_MS = 60 * 1000

export class DatabaseApiTracker {
  private maxRecords: number
  private logger: Console
  private lastCleanupTime: number = 0
  private supabaseClient: SupabaseClient | null = null

  constructor({ maxRecords = 1000, logger = console } = {}) {
    this.maxRecords = maxRecords
    this.logger = logger
  }

  private async getSupabaseClient() {
    if (!this.supabaseClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

      if (!url) {
        throw new Error('[api-tracker] Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!key) {
        throw new Error('[api-tracker] Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable')
      }

      this.supabaseClient = await createServerClient()
    }
    return this.supabaseClient
  }

  private async maybeCleanup() {
    const now = Date.now()
    if (now - this.lastCleanupTime < CLEANUP_INTERVAL_MS) {
      return
    }

    this.lastCleanupTime = now
    await this.cleanupOldRecords()
  }

  private async cleanupOldRecords(): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get current count
      const { count } = await supabase
        .from('api_call_log')
        .select('*', { count: 'exact', head: true })

      if (count && count > this.maxRecords) {
        // Delete oldest records, keeping the most recent maxRecords
        const { data: oldest } = await supabase
          .from('api_call_log')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(count - this.maxRecords)

        if (oldest && oldest.length > 0) {
          const idsToDelete = oldest.map((r) => r.id)
          await supabase.from('api_call_log').delete().in('id', idsToDelete)
        }
      }
    } catch (error) {
      console.error('[api-tracker] cleanup error:', error)
    }
  }

  async logAPICall(
    apiName: string,
    endpoint: string,
    symbol: string | null = null,
    timeframe: string | null = null,
    success: boolean = true,
    responseTime: number = 0
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()

      const { error } = await supabase.from('api_call_log').insert({
        api_name: apiName,
        endpoint: endpoint,
        symbol: symbol,
        timeframe: timeframe,
        success: success,
        response_time: responseTime,
      })

      if (error) {
        console.error('[api-tracker] log error:', error)
        return
      }

      // Log to console for development visibility
      this.logger.log(
        `[api] ${apiName} ${endpoint}${symbol ? ` (${symbol})` : ''} ${success ? 'ok' : 'failed'} ${responseTime}ms`
      )

      // Rate-limited cleanup (not on every call)
      await this.maybeCleanup()
    } catch (error) {
      console.error('[api-tracker] log error:', error)
    }
  }

  async getAPIStatistics(): Promise<ApiStats> {
    try {
      const supabase = await this.getSupabaseClient()

      // Get recent calls (last 50)
      const { data: recentCalls } = await supabase
        .from('api_call_log')
        .select('id, api_name, endpoint, symbol, timeframe, success, response_time, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      // Use SQL aggregation for per-API stats (efficient, no memory bloat)
      const { data: aggregatedStats } = await supabase.rpc('get_api_stats')

      const stats: ApiStats = {
        totalCalls: 0,
        apis: {},
        recentCalls: (recentCalls || []).map((r) => ({
          id: r.id,
          api_name: r.api_name,
          endpoint: r.endpoint,
          symbol: r.symbol,
          timeframe: r.timeframe,
          success: r.success,
          response_time: r.response_time,
          created_at: r.created_at,
        })),
      }

      // If RPC function exists, use it; otherwise fall back to manual calculation
      if (aggregatedStats && Array.isArray(aggregatedStats)) {
        for (const row of aggregatedStats) {
          stats.apis[row.api_name] = {
            total: row.total_calls || 0,
            successful: row.successful_calls || 0,
            failed: row.failed_calls || 0,
            averageResponseTime: Math.round(row.avg_response_time || 0),
          }
          stats.totalCalls += stats.apis[row.api_name].total
        }
      } else {
        // Fallback: fetch all and aggregate in memory (less efficient but works without RPC)
        const { data: allCalls } = await supabase
          .from('api_call_log')
          .select('api_name, success, response_time')

        if (allCalls) {
          for (const call of allCalls) {
            const bucket =
              stats.apis[call.api_name] ||
              (stats.apis[call.api_name] = {
                total: 0,
                successful: 0,
                failed: 0,
                averageResponseTime: 0,
              })

            bucket.total += 1
            bucket.averageResponseTime += call.response_time
            if (call.success) {
              bucket.successful += 1
            } else {
              bucket.failed += 1
            }
          }

          // Calculate averages
          for (const bucket of Object.values(stats.apis)) {
            if (bucket.total > 0) {
              bucket.averageResponseTime = Math.round(bucket.averageResponseTime / bucket.total)
            }
          }

          stats.totalCalls = allCalls.length
        }
      }

      return stats
    } catch (error) {
      console.error('[api-tracker] stats error:', error)
      return {
        totalCalls: 0,
        apis: {},
        recentCalls: [],
      }
    }
  }

  async getRecentCalls(limit: number = 50): Promise<ApiCallEntry[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data } = await supabase
        .from('api_call_log')
        .select('id, api_name, endpoint, symbol, timeframe, success, response_time, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      return (
        data?.map((r) => ({
          id: r.id,
          api_name: r.api_name,
          endpoint: r.endpoint,
          symbol: r.symbol,
          timeframe: r.timeframe,
          success: r.success,
          response_time: r.response_time,
          created_at: r.created_at,
        })) || []
      )
    } catch (error) {
      console.error('[api-tracker] getRecentCalls error:', error)
      return []
    }
  }

  async getStatsByApiName(apiName: string): Promise<{
    total: number
    successful: number
    failed: number
    averageResponseTime: number
  } | null> {
    try {
      const supabase = await this.getSupabaseClient()

      // Use SQL aggregation
      const { data, error } = await supabase
        .from('api_call_log')
        .select('success, response_time')
        .eq('api_name', apiName)

      if (error || !data || data.length === 0) {
        return null
      }

      const stats = {
        total: data.length,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
      }

      for (const call of data) {
        stats.averageResponseTime += call.response_time
        if (call.success) {
          stats.successful += 1
        } else {
          stats.failed += 1
        }
      }

      stats.averageResponseTime = Math.round(stats.averageResponseTime / stats.total)
      return stats
    } catch (error) {
      console.error('[api-tracker] getStatsByApiName error:', error)
      return null
    }
  }
}

export function createDatabaseApiTracker(options?: { maxRecords?: number; logger?: Console }) {
  return new DatabaseApiTracker(options)
}
