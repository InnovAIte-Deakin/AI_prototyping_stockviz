/**
 * Database-backed cache service using Supabase.
 * Replaces the in-memory CacheService for production readiness.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CacheEntry {
  cache_key: string
  data: unknown
  expires_at: string
  created_at: string
}

export interface CacheStats {
  total: number
  valid: number
  expired: number
  timeout: number
}

// Buffer time in milliseconds to avoid returning nearly-expired entries
const EXPIRATION_BUFFER_MS = 5000

export class DatabaseCacheService {
  private defaultTimeoutMs: number
  private supabaseClient: SupabaseClient | null = null

  constructor({ defaultTimeoutMs = 5 * 60 * 1000 } = {}) {
    this.defaultTimeoutMs = defaultTimeoutMs
  }

  private async getSupabaseClient() {
    if (!this.supabaseClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

      if (!url) {
        throw new Error('[cache] Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      }
      if (!key) {
        throw new Error('[cache] Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable')
      }

      this.supabaseClient = await createServerClient()
    }
    return this.supabaseClient
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('data, expires_at')
        .eq('cache_key', key)
        .single()

      if (error || !data) {
        return null
      }

      // Add buffer to expiration check to avoid returning nearly-expired entries
      const expiresAt = new Date(data.expires_at).getTime()
      if (Date.now() + EXPIRATION_BUFFER_MS > expiresAt) {
        // Cache expired or nearly expired - delete it and return null
        await this.delete(key)
        return null
      }

      return data.data as T
    } catch (error) {
      console.error('[cache] get error:', error)
      return null
    }
  }

  async set(key: string, data: unknown, ttlMs: number = this.defaultTimeoutMs): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      const expiresAt = new Date(Date.now() + ttlMs).toISOString()

      const { error } = await supabase
        .from('analysis_cache')
        .upsert(
          {
            cache_key: key,
            data,
            expires_at: expiresAt,
          },
          {
            onConflict: 'cache_key',
          }
        )

      if (error) {
        console.error('[cache] set error:', error)
      }
    } catch (error) {
      console.error('[cache] set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      await supabase.from('analysis_cache').delete().eq('cache_key', key)
    } catch (error) {
      console.error('[cache] delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      await supabase.from('analysis_cache').delete()
    } catch (error) {
      console.error('[cache] clear error:', error)
    }
  }

  async stats(): Promise<CacheStats> {
    try {
      const supabase = await this.getSupabaseClient()
      // Single query with conditional aggregation
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('expires_at', { count: 'exact' })

      if (error) {
        throw error
      }

      const total = data?.length || 0
      let valid = 0
      let expired = 0

      for (const row of data || []) {
        const expiresAt = new Date(row.expires_at).getTime()
        if (Date.now() + EXPIRATION_BUFFER_MS > expiresAt) {
          expired++
        } else {
          valid++
        }
      }

      return {
        total,
        valid,
        expired,
        timeout: this.defaultTimeoutMs,
      }
    } catch (error) {
      console.error('[cache] stats error:', error)
      return {
        total: 0,
        valid: 0,
        expired: 0,
        timeout: this.defaultTimeoutMs,
      }
    }
  }

  async cleanupExpired(limit: number = 1000): Promise<number> {
    try {
      const supabase = await this.getSupabaseClient()
      const now = new Date().toISOString()

      // Delete in batches to avoid timeout on large datasets
      const { data, error } = await supabase
        .from('analysis_cache')
        .delete()
        .lte('expires_at', now)
        .select('cache_key')
        .limit(limit)

      if (error) {
        console.error('[cache] cleanup error:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('[cache] cleanup error:', error)
      return 0
    }
  }
}

export function createDatabaseCacheService(options?: { defaultTimeoutMs?: number }) {
  return new DatabaseCacheService(options)
}
