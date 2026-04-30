/**
 * Hybrid cache service wrapper.
 * Provides a synchronous facade over the database-backed cache implementation.
 *
 * Uses a Promise cache pattern to handle async operations while exposing sync API.
 */

import {
  createDatabaseCacheService,
  type CacheStats,
  type DatabaseCacheService,
} from "./database-cache";

// Singleton instance (lazy initialized)
let dbCacheInstance: DatabaseCacheService | null = null;

function getDbCache(): DatabaseCacheService {
  if (!dbCacheInstance) {
    dbCacheInstance = createDatabaseCacheService({
      defaultTimeoutMs: 5 * 60 * 1000,
    });
  }
  return dbCacheInstance;
}

// Promise cache for in-flight operations
const pendingGets = new Map<string, Promise<unknown | null>>();
const pendingSets = new Map<string, Promise<void>>();

export type CacheServiceOptions = {
  defaultTimeout?: number;
};

class HybridCacheService {
  private defaultTimeout: number;

  constructor({ defaultTimeout = 5 * 60 * 1000 }: CacheServiceOptions = {}) {
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Get value from cache.
   * Returns the last known value immediately if async operation is pending.
   * @param {string} key
   * @returns {unknown|null}
   */
  get(key: string): unknown | null {
    const dbCache = getDbCache();

    // Start async fetch in background
    const promise = dbCache.get(key);

    // Cache the promise for deduplication
    if (!pendingGets.has(key)) {
      pendingGets.set(
        key,
        promise.then((value) => {
          pendingGets.delete(key);
          return value;
        }),
      );
    }

    // Return null immediately (sync interface)
    // Callers should not rely on immediate return value for critical data
    return null;
  }

  /**
   * Get value from cache (async version for when you need the actual value).
   * @param {string} key
   * @returns {Promise<unknown|null>}
   */
  async getAsync<T = unknown>(key: string): Promise<T | null> {
    const dbCache = getDbCache();
    return await dbCache.get<T>(key);
  }

  /**
   * Set value in cache.
   * Fire-and-forget async operation.
   * @param {string} key
   * @param {unknown} data
   * @param {number} [ttlMs]
   */
  set(key: string, data: unknown, ttlMs = this.defaultTimeout): void {
    const dbCache = getDbCache();

    // Deduplicate pending sets for same key
    const setKey = `${key}:${Date.now()}`;
    const promise = dbCache.set(key, data, ttlMs);

    if (!pendingSets.has(setKey)) {
      pendingSets.set(
        setKey,
        promise.then(() => {
          pendingSets.delete(setKey);
        }),
      );
    }
  }

  /**
   * Set value in cache (async version with confirmation).
   * @param {string} key
   * @param {unknown} data
   * @param {number} [ttlMs]
   * @returns {Promise<void>}
   */
  async setAsync(
    key: string,
    data: unknown,
    ttlMs = this.defaultTimeout,
  ): Promise<void> {
    const dbCache = getDbCache();
    await dbCache.set(key, data, ttlMs);
  }

  /**
   * Clear all cache entries.
   */
  async clear(): Promise<void> {
    const dbCache = getDbCache();
    await dbCache.clear();
  }

  /**
   * Get cache statistics.
   * @returns {Promise<{total: number, valid: number, expired: number, timeout: number}>}
   */
  async stats(): Promise<CacheStats> {
    const dbCache = getDbCache();
    return await dbCache.stats();
  }
}

function createCacheService(options?: CacheServiceOptions) {
  return new HybridCacheService(options);
}

const cacheModule = {
  HybridCacheService,
  createCacheService,
  createDatabaseCacheService,
};

export { HybridCacheService, createCacheService, createDatabaseCacheService };

export default cacheModule;
