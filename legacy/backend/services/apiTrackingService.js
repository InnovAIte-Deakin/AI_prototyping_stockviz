// services/apiTrackingService.js
class APITrackingService {
  constructor() {
    this.apiCalls = [];
    this.maxRecords = 1000; // Limit to prevent memory issues
  }

  // Log an API call
  logAPICall(apiName, endpoint, symbol = null, timeframe = null, success = true, responseTime = 0) {
    const timestamp = new Date().toISOString();
    
    // Add the API call to our tracking array
    this.apiCalls.push({
      id: this.apiCalls.length + 1,
      timestamp,
      apiName,
      endpoint,
      symbol,
      timeframe,
      success,
      responseTime // in milliseconds
    });

    // Keep only the most recent records
    if (this.apiCalls.length > this.maxRecords) {
      this.apiCalls = this.apiCalls.slice(-this.maxRecords);
    }

    // Log to console for real-time monitoring
    console.log(`📊 API Tracking: ${apiName} - ${endpoint} ${symbol ? `(${symbol})` : ''} - ${success ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`);
  }

  // Get all tracked API calls
  getAPICalls() {
    return [...this.apiCalls]; // Return a copy
  }

  // Get statistics about API usage
  getAPIStatistics() {
    const stats = {
      totalCalls: this.apiCalls.length,
      apis: {},
      recentCalls: this.apiCalls.slice(-50) // Last 50 calls
    };

    // Group by API name
    this.apiCalls.forEach(call => {
      if (!stats.apis[call.apiName]) {
        stats.apis[call.apiName] = {
          total: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0,
          endpoints: {}
        };
      }

      const apiStats = stats.apis[call.apiName];
      apiStats.total++;

      if (call.success) {
        apiStats.successful++;
      } else {
        apiStats.failed++;
      }

      apiStats.averageResponseTime += call.responseTime;

      // Track endpoints
      if (!apiStats.endpoints[call.endpoint]) {
        apiStats.endpoints[call.endpoint] = {
          total: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0
        };
      }

      const endpointStats = apiStats.endpoints[call.endpoint];
      endpointStats.total++;
      
      if (call.success) {
        endpointStats.successful++;
      } else {
        endpointStats.failed++;
      }
      
      endpointStats.averageResponseTime += call.responseTime;
    });

    // Calculate averages
    Object.values(stats.apis).forEach(apiStats => {
      if (apiStats.total > 0) {
        apiStats.averageResponseTime = Math.round(apiStats.averageResponseTime / apiStats.total);
        
        Object.values(apiStats.endpoints).forEach(endpointStats => {
          if (endpointStats.total > 0) {
            endpointStats.averageResponseTime = Math.round(endpointStats.averageResponseTime / endpointStats.total);
          }
        });
      }
    });

    return stats;
  }

  // Clear tracking data
  clearTracking() {
    this.apiCalls = [];
  }
}

module.exports = new APITrackingService();