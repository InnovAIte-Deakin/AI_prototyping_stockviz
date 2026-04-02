/**
 * Hybrid API tracker wrapper.
 * Provides the same interface as the legacy in-memory ApiTracker
 * but uses the database-backed implementation.
 */

import { createDatabaseApiTracker } from './database-api-tracker'

// Create a singleton instance
const dbTracker = createDatabaseApiTracker({ maxRecords: 1000 })

class HybridApiTracker {
  constructor({ maxRecords = 1000, logger = console } = {}) {
    this.maxRecords = maxRecords
    this.logger = logger
  }

  async logAPICall(apiName, endpoint, symbol = null, timeframe = null, success = true, responseTime = 0) {
    await dbTracker.logAPICall(apiName, endpoint, symbol, timeframe, success, responseTime)
  }

  async getAPIStatistics() {
    return await dbTracker.getAPIStatistics()
  }
}

function createApiTracker(options) {
  return new HybridApiTracker(options)
}

const observabilityModule = {
  HybridApiTracker,
  createApiTracker,
  // Also export the database implementation for direct use
  createDatabaseApiTracker,
}

export { HybridApiTracker, createApiTracker, createDatabaseApiTracker }

export default observabilityModule
