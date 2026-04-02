import { useState, useEffect } from 'react'

type Props = {
  initial?: { fundamental?: number, technical?: number, sentiment?: number }
  onChange?: (w: { fundamental: number, technical: number, sentiment: number }) => void
}

export default function WeightsPanel({ initial, onChange }: Props) {
  const [fundamental, setF] = useState(initial?.fundamental ?? 40)
  const [technical, setT] = useState(initial?.technical ?? 35)
  const [sentiment, setS] = useState(initial?.sentiment ?? 25)

  useEffect(() => {
    const total = fundamental + technical + sentiment
    if (onChange) onChange({ fundamental: Math.round(fundamental/total*100), technical: Math.round(technical/total*100), sentiment: Math.round(sentiment/total*100) })
  }, [fundamental, technical, sentiment])

  // Determine weighting style
  const getWeightingStyle = () => {
    const max = Math.max(fundamental, technical, sentiment);
    if (fundamental === max && max > 40) return 'fundamental value investing';
    if (technical === max && max > 40) return 'technical trading signals';
    if (sentiment === max && max > 40) return 'market sentiment and psychology';
    return 'balanced multi-factor approach';
  };

  // Suggest alternative weight combinations
  const suggestAlternatives = () => {
    const alternatives = [];
    
    // Conservative approach
    if (fundamental < 50) {
      alternatives.push({
        name: 'Conservative Value',
        weights: { fundamental: 60, technical: 25, sentiment: 15 },
        description: 'Focus on company fundamentals and intrinsic value'
      });
    }
    
    // Technical trading approach
    if (technical < 50) {
      alternatives.push({
        name: 'Technical Trader',
        weights: { fundamental: 20, technical: 60, sentiment: 20 },
        description: 'Emphasis on price action and technical indicators'
      });
    }
    
    // Sentiment-driven approach
    if (sentiment < 40) {
      alternatives.push({
        name: 'Sentiment Momentum',
        weights: { fundamental: 25, technical: 30, sentiment: 45 },
        description: 'Follow market psychology and news sentiment'
      });
    }
    
    return alternatives;
  };

  const weightingStyle = getWeightingStyle();
  const alternatives = suggestAlternatives();

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {[
          { label: 'Fundamental', value: fundamental, set: setF },
          { label: 'Technical', value: technical, set: setT },
          { label: 'Sentiment', value: sentiment, set: setS },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between">
              <label className="text-sm">{row.label}</label>
              <span className="text-sm">{row.value}</span>
            </div>
            <input type="range" min={0} max={100} value={row.value} onChange={(e) => row.set(parseInt(e.target.value))} className="w-full" />
          </div>
        ))}
        <div className="text-xs text-slate-500">Weights auto-normalised to 100% on request.</div>
      </div>

      <div className="border-t pt-3">
        <div className="text-sm font-medium mb-2">Weighting Style</div>
        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
          {weightingStyle}
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-sm font-medium mb-2">Suggested Alternatives</div>
          <div className="space-y-2">
            {alternatives.map((alt, index) => (
              <button
                key={index}
                className="w-full text-left p-2 border rounded text-xs hover:bg-slate-50"
                onClick={() => {
                  setF(alt.weights.fundamental);
                  setT(alt.weights.technical);
                  setS(alt.weights.sentiment);
                }}
              >
                <div className="font-medium">{alt.name}</div>
                <div className="text-slate-600">{alt.description}</div>
                <div className="text-slate-500 mt-1">
                  F:{alt.weights.fundamental}% T:{alt.weights.technical}% S:{alt.weights.sentiment}%
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
