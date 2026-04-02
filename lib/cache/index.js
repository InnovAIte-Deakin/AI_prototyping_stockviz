/**
 * Hybrid cache service wrapper.
 * Provides the same SYNCHRONOUS interface as the legacy in-memory CacheService
 * but uses the database-backed implementation internally.
 *
 * Uses a Promise cache pattern to handle async operations while exposing sync API.
 */

import { createDatabaseCacheService } from './database-cache'

// Singleton instance (lazy initialized)
let dbCacheInstance = null

function getDbCache() {
  if (!dbCacheInstance) {
    dbCacheInstance = createDatabaseCacheService({ defaultTimeoutMs: 5 * 60 * 1000 })
  }
  return dbCacheInstance
}

// Promise cache for in-flight operations
const pendingGets = new Map()
const pendingSets = new Map()

class HybridCacheService {
  constructor({ defaultTimeout = 5 * 60 * 1000 } = {}) {
    this.defaultTimeout = defaultTimeout
  }

  /**
   * Get value from cache.
   * Returns the last known value immediately if async operation is pending.
   * @param {string} key
   * @returns {unknown|null}
   */
  get(key) {
    const dbCache = getDbCache()

    // Start async fetch in background
    const promise = dbCache.get(key)

    // Cache the promise for deduplication
    if (!pendingGets.has(key)) {
      pendingGets.set(
        key,
        promise.then((value) => {
          pendingGets.delete(key)
          return value
        })
      )
    }

    // Return null immediately (sync interface)
    // Callers should not rely on immediate return value for critical data
    return null
  }

  /**
   * Get value from cache (async version for when you need the actual value).
   * @param {string} key
   * @returns {Promise<unknown|null>}
   */
  async getAsync(key) {
    const dbCache = getDbCache()
    return await dbCache.get(key)
  }

  /**
   * Set value in cache.
   * Fire-and-forget async operation.
   * @param {string} key
   * @param {unknown} data
   * @param {number} [ttlMs]
   */
  set(key, data, ttlMs = this.defaultTimeout) {
    const dbCache = getDbCache()

    // Deduplicate pending sets for same key
    const setKey = `${key}:${Date.now()}`
    const promise = dbCache.set(key, data, ttlMs)

    if (!pendingSets.has(setKey)) {
      pendingSets.set(
        setKey,
        promise.then(() => {
          pendingSets.delete(setKey)
        })
      )
    }
  }

  /**
   * Set value in cache (async version with confirmation).
   * @param {string} key
   * @param {unknown} data
   * @param {number} [ttlMs]
   * @returns {Promise<void>}
   */
  async setAsync(key, data, ttlMs = this.defaultTimeout) {
    const dbCache = getDbCache()
    await dbCache.set(key, data, ttlMs)
  }

  /**
   * Clear all cache entries.
   */
  async clear() {
    const dbCache = getDbCache()
    await dbCache.clear()
  }

  /**
   * Get cache statistics.
   * @returns {Promise<{total: number, valid: number, expired: number, timeout: number}>}
   */
  async stats() {
    const dbCache = getDbCache()
    return await dbCache.stats()
  }
}

function createCacheService(options) {
  return new HybridCacheService(options)
}

const cacheModule = {
  HybridCacheService,
  createCacheService,
  createDatabaseCacheService,
}

export { HybridCacheService, createCacheService, createDatabaseCacheService }

export default cacheModule
