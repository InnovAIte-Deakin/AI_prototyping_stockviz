class ApiTracker {
  constructor({ maxRecords = 1000, logger = console } = {}) {
    this.maxRecords = maxRecords;
    this.logger = logger;
    this.apiCalls = [];
  }

  logAPICall(apiName, endpoint, symbol = null, timeframe = null, success = true, responseTime = 0) {
    this.apiCalls.push({
      id: this.apiCalls.length + 1,
      timestamp: new Date().toISOString(),
      apiName,
      endpoint,
      symbol,
      timeframe,
      success,
      responseTime,
    });

    if (this.apiCalls.length > this.maxRecords) {
      this.apiCalls = this.apiCalls.slice(-this.maxRecords);
    }

    this.logger.log(
      `[api] ${apiName} ${endpoint}${symbol ? ` (${symbol})` : ""} ${success ? "ok" : "failed"} ${responseTime}ms`
    );
  }

  getAPIStatistics() {
    const stats = {
      totalCalls: this.apiCalls.length,
      apis: {},
      recentCalls: this.apiCalls.slice(-50),
    };

    for (const call of this.apiCalls) {
      const bucket =
        stats.apis[call.apiName] ||
        (stats.apis[call.apiName] = {
          total: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0,
        });

      bucket.total += 1;
      bucket.averageResponseTime += call.responseTime;
      if (call.success) bucket.successful += 1;
      else bucket.failed += 1;
    }

    for (const bucket of Object.values(stats.apis)) {
      if (bucket.total > 0) {
        bucket.averageResponseTime = Math.round(bucket.averageResponseTime / bucket.total);
      }
    }

    return stats;
  }
}

function createApiTracker(options) {
  return new ApiTracker(options);
}

module.exports = {
  ApiTracker,
  createApiTracker,
};
