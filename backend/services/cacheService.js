// services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Remove expired item
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
  
  // New method to get cache statistics
  stats() {
    let expiredCount = 0;
    let validCount = 0;
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      timeout: this.cacheTimeout
    };
  }
  
  // New method to clean up expired entries
  cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
}

module.exports = new CacheService();