class SearchService {
  constructor({ dataSourceManager, logger = console } = {}) {
    this.dataSourceManager = dataSourceManager;
    this.logger = logger;
  }

  async searchSymbols(query) {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 1) {
      return {
        status: "error",
        message: "Query parameter is required and must be at least 1 character",
        results: [],
      };
    }

    try {
      const response = await this.dataSourceManager.searchSymbols(trimmed);
      return {
        status: "success",
        query: trimmed,
        results: response.results || [],
        source: response.source || "live",
      };
    } catch (error) {
      this.logger.error("Search error:", error);
      return {
        status: "success",
        query: trimmed,
        results: this.dataSourceManager.generateFallbackSearchResults(trimmed),
        source: "fallback",
      };
    }
  }
}

function createSearchService(options) {
  return new SearchService(options);
}

module.exports = {
  SearchService,
  createSearchService,
};
