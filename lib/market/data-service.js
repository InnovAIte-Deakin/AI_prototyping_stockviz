class DataService {
  constructor({ dataSourceManager, logger = console } = {}) {
    this.dataSourceManager = dataSourceManager;
    this.logger = logger;
  }

  async fetchStockData(symbol, timeframe) {
    try {
      return await this.dataSourceManager.fetchStockData(symbol, timeframe);
    } catch (error) {
      this.logger.error("Error fetching stock data:", error);
      return this.dataSourceManager.generateMockData(symbol, timeframe);
    }
  }
}

function createDataService(options) {
  return new DataService(options);
}

module.exports = {
  DataService,
  createDataService,
};
