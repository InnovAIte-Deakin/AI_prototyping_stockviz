import { useParams, useSearchParams } from 'react-router-dom';
import { useAnalysis } from '../lib/queries';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ScoreBadge from '../components/ScoreBadge';
import RecommendationChip from '../components/RecommendationChip';
import AISummary from '../components/AISummary';
import { decodeState } from '../lib/urlState';

// This component fetches and displays the analysis results.
export default function AnalysisResultsPage() {
  const { symbol = '' } = useParams();
  const [sp] = useSearchParams();

  // Extract parameters from the URL
  const mode = sp.get('mode') || 'normal';
  const timeframe = sp.get('tf');
  const weightsStr = sp.get('w'); // The parameter from the config page is 'w'
  const indicatorsStr = sp.get('ind');

  // --- FIX: Use decodeState for weights and indicators ---
  const weights = weightsStr ? decodeState(weightsStr) : undefined;
  const indicators = indicatorsStr ? decodeState(indicatorsStr) : undefined;

  const { data, isFetching, error } = useAnalysis({
    symbol,
    mode: mode as 'normal' | 'advanced',
    timeframe: timeframe ?? undefined,
    weights,
    indicators,
  });

  if (isFetching) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-96">
        <LoadingSpinner />
        <span className="ml-4 text-lg font-semibold">Running Hybrid Analysis for {symbol.toUpperCase()}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500 text-center">
        <h2 className="text-2xl font-bold mb-4">Analysis Failed</h2>
        <p className="bg-red-100 dark:bg-red-900 p-4 rounded-md">
          {error.message || 'An unknown error occurred while fetching the analysis.'}
        </p>
      </div>
    );
  }

  const analysisData = data?.analysis;

  if (!analysisData) {
    return <div className="text-center p-8">No analysis data was returned. Please try again.</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap justify-between items-center gap-4">
            <span>Analysis for {symbol.toUpperCase()}</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-normal">Overall Score:</span>
              <ScoreBadge score={analysisData.overall?.score} />
              <RecommendationChip rec={analysisData.overall?.recommendation} />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {analysisData.aiInsights?.summary && (
        <AISummary text={analysisData.aiInsights.summary} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fundamental Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Fundamental</span>
              <ScoreBadge score={analysisData.fundamental?.score} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <RecommendationChip rec={analysisData.fundamental?.recommendation} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysisData.fundamental?.analysis || 'No detailed analysis available.'}
            </p>
          </CardContent>
        </Card>

        {/* Technical Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Technical</span>
              <ScoreBadge score={analysisData.technical?.score} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <RecommendationChip rec={analysisData.technical?.recommendation} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysisData.technical?.analysis || 'No detailed analysis available.'}
            </p>
          </CardContent>
        </Card>

        {/* Sentiment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Sentiment</span>
              <ScoreBadge score={analysisData.sentiment?.score} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <RecommendationChip rec={analysisData.sentiment?.recommendation} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysisData.sentiment?.analysis || 'No detailed analysis available.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
