import { Activity, Newspaper, TrendingDown, TrendingUp } from "lucide-react"
import type { SentimentAnalysis, SentimentHeadline } from "@/lib/types"

type SentimentHeadlinesProps = {
  sentiment?: SentimentAnalysis
  symbol: string
}

function normalizeHeadlines(sentiment?: SentimentAnalysis): SentimentHeadline[] {
  if (Array.isArray(sentiment?.newsItems) && sentiment.newsItems.length > 0) {
    return sentiment.newsItems
  }

  if (Array.isArray(sentiment?.headlines) && sentiment.headlines.length > 0) {
    return sentiment.headlines
  }

  return []
}

function getHeadlineScore(item: SentimentHeadline) {
  const raw = item.sentiment ?? item.score
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null
}

function getHeadlineTone(score: number | null) {
  if (score === null) {
      return {
      label: "Neutral",
      className: "border-[#ddd6d1] bg-[#f6f3f0] text-[#6a706f]",
      Icon: Activity,
    }
  }

  if (score >= 0.15) {
    return {
      label: "Positive",
      className: "border-[#d6ead8] bg-[#edf7ee] text-[#24613d]",
      Icon: TrendingUp,
    }
  }

  if (score <= -0.15) {
    return {
      label: "Negative",
      className: "border-[#f1d4d1] bg-[#fdeceb] text-[#8a2f2d]",
      Icon: TrendingDown,
    }
  }

    return {
      label: "Mixed",
      className: "border-[#e9debf] bg-[#f8f1df] text-[#7a5d18]",
      Icon: Activity,
    }
  }

function formatHeadlineScore(score: number | null) {
  if (score === null) return "n/a"
  return score.toFixed(2)
}

export function SentimentHeadlines({ sentiment, symbol }: SentimentHeadlinesProps) {
  const headlines = normalizeHeadlines(sentiment)
  const source = sentiment?.source || "Sentiment feed"
  const summary =
    sentiment?.summary || `No detailed sentiment summary is available for ${symbol} right now.`

  return (
    <section className="rounded-[24px] border border-[#e6e0db] bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#f1ece8] p-3 text-[#5f5e5e]">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#4f4e4e]">News and sentiment</h2>
            <p className="text-sm text-[#6a706f]">
              {source} • {headlines.length} recent article{headlines.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="rounded-full border border-[#ddd6d1] bg-[#f8f5f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7b7f7f]">
          Score {Math.round(Number(sentiment?.score ?? 50))}
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-[#4b514f]">{summary}</p>

      {headlines.length > 0 ? (
        <div className="mt-6 space-y-3">
          {headlines.slice(0, 6).map((headline, index) => {
            const score = getHeadlineScore(headline)
            const tone = getHeadlineTone(score)
            const ToneIcon = tone.Icon

            return (
              <article
                key={`${headline.title || "headline"}-${index}`}
                className="rounded-[20px] border border-[#ece6e1] bg-[#fbf8f6] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-6 text-[#414746]">
                      {headline.title || `Untitled ${symbol} sentiment item`}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8b908f]">
                      {headline.publisher || source}
                    </p>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.className}`}
                  >
                    <ToneIcon className="h-3.5 w-3.5" />
                    <span>
                      {tone.label} {formatHeadlineScore(score)}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#ded7d2] bg-[#fbf8f6] p-5">
          <p className="text-sm font-medium text-[#4f4e4e]">No recent headlines available</p>
          <p className="mt-2 text-sm leading-6 text-[#6a706f]">
            The analysis service returned a neutral sentiment fallback for {symbol}. Once a news
            source responds, recent article summaries will appear here.
          </p>
        </div>
      )}
    </section>
  )
}
