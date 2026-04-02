class NoopApiTracker {
  logAPICall() {}
}

class SentimentService {
  constructor({ apiTracker = new NoopApiTracker(), fetchImpl = fetch, env = process.env } = {}) {
    this.apiTracker = apiTracker;
    this.fetchImpl = fetchImpl;
    this.env = env;
  }

  async fetchAlphaVantageNewsSentiment(symbol) {
    const apiKey = this.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) throw new Error("ALPHA_VANTAGE_KEY missing");

    const startTime = Date.now();

    try {
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(
        symbol
      )}&sort=LATEST&limit=50&apikey=${apiKey}`;

      this.apiTracker.logAPICall("Alpha Vantage", "NEWS_SENTIMENT", symbol, null, true, 0);
      const response = await this.fetchImpl(url);
      const responseTime = Date.now() - startTime;

      if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);

      const data = await response.json();
      const feed = Array.isArray(data.feed) ? data.feed : [];

      if (feed.length === 0) {
        this.apiTracker.logAPICall("Alpha Vantage", "NEWS_SENTIMENT", symbol, null, true, responseTime);
        return {
          score: 50,
          source: "Alpha Vantage News",
          summary: `No recent news for ${symbol}.`,
          headlines: [],
          newsItems: [],
        };
      }

      const average =
        feed.reduce((total, item) => total + (Number(item.overall_sentiment_score) || 0), 0) / feed.length;

      const headlines = feed.slice(0, 8).map((item) => ({
        title: item.title,
        publisher: item.source,
        score: Number(item.overall_sentiment_score) || 0,
        sentiment: Number(item.overall_sentiment_score) || 0,
      }));

      this.apiTracker.logAPICall("Alpha Vantage", "NEWS_SENTIMENT", symbol, null, true, responseTime);

      return {
        score: Math.round((average + 1) * 50),
        source: "Alpha Vantage News",
        summary: `Avg sentiment score ${average.toFixed(2)} across ${feed.length} articles.`,
        headlines,
        newsItems: headlines,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiTracker.logAPICall("Alpha Vantage", "NEWS_SENTIMENT", symbol, null, false, responseTime);
      throw error;
    }
  }
}

function createSentimentService(options) {
  return new SentimentService(options);
}

module.exports = {
  SentimentService,
  createSentimentService,
};
