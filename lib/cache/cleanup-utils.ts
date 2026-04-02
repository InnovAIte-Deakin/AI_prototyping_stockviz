/**
 * Shared cache cleanup utilities.
 * Used by both the database cache service and standalone cleanup scripts.
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Delete expired cache entries in batches.
 * @param supabase - Supabase client instance
 * @param batchSize - Number of entries to delete per batch (default: 1000)
 * @param maxBatches - Maximum number of batches to process (default: 10)
 * @returns Total number of deleted entries
 */
export async function cleanupExpiredCacheBatch(
  supabase: SupabaseClient,
  batchSize: number = 1000,
  maxBatches: number = 10
): Promise<number> {
  let totalDeleted = 0
  let batchNum = 0

  while (batchNum < maxBatches) {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('analysis_cache')
      .delete()
      .lte('expires_at', now)
      .select('cache_key')
      .limit(batchSize)

    if (error) {
      console.error(`[cache-cleanup] Batch ${batchNum + 1} error:`, error.message)
      break
    }

    const deletedCount = data?.length || 0
    totalDeleted += deletedCount

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
 * @param supabase - Supabase client instance
 * @param maxRecords - Maximum number of records to keep (default: 1000)
 * @returns Number of deleted entries
 */
export async function cleanupOldApiLogsBatch(
  supabase: SupabaseClient,
  maxRecords: number = 1000
): Promise<number> {
  try {
    // Get current count
    const { count } = await supabase
      .from('api_call_log')
      .select('*', { count: 'exact', head: true })

    if (!count || count <= maxRecords) {
      return 0
    }

    const toDelete = count - maxRecords

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

    return deletedCount
  } catch (error) {
    console.error('[api-cleanup] Error:', error)
    return 0
  }
}
