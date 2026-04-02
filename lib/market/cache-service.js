class CacheService {
  constructor({ defaultTimeout = 5 * 60 * 1000 } = {}) {
    this.defaultTimeout = defaultTimeout;
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data, ttlMs = this.defaultTimeout) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this.cache.clear();
  }

  stats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const value of this.cache.values()) {
      if (value.expiresAt > now) valid += 1;
      else expired += 1;
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      timeout: this.defaultTimeout,
    };
  }
}

function createCacheService(options) {
  return new CacheService(options);
}

module.exports = {
  CacheService,
  createCacheService,
};
