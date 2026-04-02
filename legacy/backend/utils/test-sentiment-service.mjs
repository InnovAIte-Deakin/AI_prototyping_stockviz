// Run: node scripts/test-sentiment-service.mjs AAPL
// Pre-req: set $env:ALPHA_VANTAGE_KEY="YOUR_KEY" in PowerShell (same terminal)

const symbol = process.argv[2] || "AAPL";
const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

if (!apiKey) {
  console.error("❌ Missing ALPHA_VANTAGE_KEY env var");
  process.exit(1);
}

const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&sort=LATEST&limit=50&apikey=${apiKey}`;

const res = await fetch(url);
const data = await res.json();

if (!res.ok) {
  console.error(`❌ HTTP ${res.status}`);
  console.error(data);
  process.exit(1);
}
if (data?.Note || data?.Information) {
  console.error("⚠️ Alpha Vantage limit/info:", data.Note || data.Information);
  process.exit(2);
}

const feed = Array.isArray(data.feed) ? data.feed : [];
const avg = feed.length
  ? feed.reduce((a, it) => a + (Number(it.overall_sentiment_score) || 0), 0) / feed.length
  : 0;

// Map -1..+1 to 0..100
const score = Math.round((avg + 1) * 50);

console.log(JSON.stringify({
  symbol,
  articles: feed.length,
  avgScoreRaw: Number(avg.toFixed(3)),   // -1..+1
  sentimentScore: score,                  // 0..100
  sample: feed.slice(0, 5).map(x => ({
    title: x.title, src: x.source, score: x.overall_sentiment_score
  })),
}, null, 2));
