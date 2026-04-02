/**
 * Cache cleanup script.
 * Run periodically to remove expired entries from the analysis_cache table.
 * 
 * Usage: node --import tsx scripts/cleanup-cache.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[cleanup] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable')
  process.exit(1)
}

// Use service role key for server-side operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Delete expired cache entries in batches.
 * @param batchSize - Number of entries to delete per batch (default: 1000)
 * @returns Total number of deleted entries
 */
async function cleanupExpiredCache(batchSize: number = 1000): Promise<number> {
  let totalDeleted = 0
  let batchNum = 0
  const maxBatches = 10 // Prevent infinite loops

  while (batchNum < maxBatches) {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('analysis_cache')
      .delete()
      .lte('expires_at', now)
      .select('cache_key')
      .limit(batchSize)

    if (error) {
      console.error(`[cleanup] Batch ${batchNum + 1} error:`, error.message)
      break
    }

    const deletedCount = data?.length || 0
    totalDeleted += deletedCount

    console.log(`[cleanup] Batch ${batchNum + 1}: deleted ${deletedCount} entries`)

    // Stop if no more entries to delete
    if (deletedCount < batchSize) {
      break
    }

    batchNum++
  }

  return totalDeleted
}

/**
 * Delete old API log entries, keeping only the most recent records.
 * @param maxRecords - Maximum number of records to keep (default: 1000)
 * @returns Number of deleted entries
 */
async function cleanupOldApiLogs(maxRecords: number = 1000): Promise<number> {
  try {
    // Get current count
    const { count } = await supabase
      .from('api_call_log')
      .select('*', { count: 'exact', head: true })

    if (!count || count <= maxRecords) {
      console.log('[cleanup] API log cleanup: no action needed')
      return 0
    }

    const toDelete = count - maxRecords
    console.log(`[cleanup] API log cleanup: removing ${toDelete} old entries`)

    // Get IDs of oldest records to delete
    const { data: oldest } = await supabase
      .from('api_call_log')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(toDelete)

    if (!oldest || oldest.length === 0) {
      return 0
    }

    // Delete in batches to avoid URL length limits
    const batchSize = 500
    let deletedCount = 0

    for (let i = 0; i < oldest.length; i += batchSize) {
      const batch = oldest.slice(i, i + batchSize)
      const idsToDelete = batch.map((r) => r.id)

      const { data: deleted } = await supabase
        .from('api_call_log')
        .delete()
        .in('id', idsToDelete)
        .select('id')

      deletedCount += deleted?.length || 0
    }

    console.log(`[cleanup] API log cleanup: deleted ${deletedCount} entries`)
    return deletedCount
  } catch (error) {
    console.error('[cleanup] API log cleanup error:', error)
    return 0
  }
}

async function main() {
  console.log('[cleanup] Starting cleanup...')
  
  const cacheDeleted = await cleanupExpiredCache()
  console.log(`[cleanup] Cache cleanup complete: ${cacheDeleted} entries deleted`)
  
  const apiDeleted = await cleanupOldApiLogs()
  console.log(`[cleanup] API log cleanup complete: ${apiDeleted} entries deleted`)
  
  console.log('[cleanup] Done.', { cache: cacheDeleted, api: apiDeleted })
}

main().catch((error) => {
  console.error('[cleanup] Fatal error:', error)
  process.exit(1)
})

export { cleanupExpiredCache, cleanupOldApiLogs }
