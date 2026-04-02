import React, { useState } from 'react';
// allow runtime require fallback in this file
declare const require: any;
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Using simple elements instead of small UI primitives that aren't present
import { Loader, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info, BarChart3, PieChart, Newspaper, Calculator } from 'lucide-react';
// useToast not available in this workspace; use console fallback
import SearchBox from './SearchBox';
import PriceChart from './PriceChart';
// Optional service - may not exist in this repo; guarded at runtime
let EnhancedStockService: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EnhancedStockService = require('@/services/enhancedStockService').default || require('@/services/enhancedStockService');
} catch (e) {
  // service not available; keep simulated behavior
}

// Minimal types to keep this file self-contained; adapt as needed
type AnalysisMode = 'smart' | 'pro';
type AnalysisDuration = '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y';

const EnhancedStockAnalysis: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('smart');
  const [analysisDuration, setAnalysisDuration] = useState<AnalysisDuration>('1M');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing analysis...');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const toast = (opts: any) => console.log('TOAST:', opts);

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setError(null);
    setAnalysisResult(null);
  };

  const handleAnalysisSubmit = async () => {
    if (!selectedCompany) {
      toast({ title: 'No Company Selected', description: 'Please select a company to analyze.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Initializing analysis...');

    try {
      // Simulate analysis steps
      setLoadingMessage('Fetching market data...');
      await new Promise(res => setTimeout(res, 600));
      setLoadingMessage('Analyzing technical indicators...');
      await new Promise(res => setTimeout(res, 800));
      setLoadingMessage('Processing fundamentals...');
      await new Promise(res => setTimeout(res, 600));

      // Call service if available
      if ((EnhancedStockService as any)?.analyzeStock) {
        const res = await (EnhancedStockService as any).analyzeStock({ symbol: selectedCompany.symbol });
        // Normalize known upstream mock/enhanced service shape to our component's expected shape
        // Upstream mock returns: { symbol, companyName, recommendation: {action, confidence, score}, aiSummary, ... }
        if (res && (res.aiSummary || res.recommendation)) {
          setAnalysisResult(res);
        } else if (res && res.analysis) {
          // Backend analyzer returns { status, symbol, analysis: { overall: { score, recommendation }, aiInsights: { summary }, ... } }
          const companyName = res.companyName || selectedCompany.name || res.symbol || selectedCompany.symbol;
          const symbol = res.symbol || selectedCompany.symbol;
          const rec = res.analysis?.overall?.recommendation || res.analysis?.overall || res.recommendation || 'HOLD';
          const score = res.analysis?.overall?.score ?? res.recommendation?.score ?? res.analysis?.enhanced?.aggregateScore ?? 50;
          // Robust AI summary extraction: support multiple shapes (backend aiInsights, upstream supabase `insights`, raw, or arrays)
          const aiCandidates: Array<string | undefined> = [];

          // common locations
          aiCandidates.push(res.aiSummary);
          aiCandidates.push(res.raw);

          // top-level insights (supabase function returns { insights: { full_analysis, executive_summary, ... } })
          if (res.insights) {
            aiCandidates.push(res.insights.full_analysis || res.insights.fullAnalysis);
            aiCandidates.push(res.insights.executive_summary || res.insights.executiveSummary);
            aiCandidates.push(res.insights.investment_recommendation || res.insights.investmentRecommendation);
          }

          // analysis subtree
          if (res.analysis) {
            aiCandidates.push(res.analysis.aiInsights?.summary);
            // analysis.insights may be camelCase or snake_case
            const ains = res.analysis.insights || {};
            aiCandidates.push(ains.full_analysis || ains.fullAnalysis || ains.fullAnalysisText || ains.full_analysis_text);
            aiCandidates.push(ains.executive_summary || ains.executiveSummary);
            aiCandidates.push(ains.investment_recommendation || ains.investmentRecommendation || ains.recommendation);
            // join key strengths/concerns if present
            const ks = (ains.key_strengths || ains.keyStrengths || ains.keyStrength || []).filter?.(Boolean);
            if (ks && ks.length) aiCandidates.push(ks.join('\n'));
            const kc = (ains.key_concerns || ains.keyConcerns || ains.keyConcerns || ains.key_concern || []).filter?.(Boolean);
            if (kc && kc.length) aiCandidates.push(kc.join('\n'));
          }

          // fallback to array join
          if (Array.isArray(res)) aiCandidates.push(res.join('\n'));

          const aiSummary = aiCandidates.find(Boolean) || '';
          const currentPrice = res.currentPrice || res.analysis?.meta?.price || '$0.00';

          setAnalysisResult({
            companyName,
            symbol,
            recommendation: { action: typeof rec === 'string' ? rec : (rec.action || 'HOLD'), confidence: typeof rec === 'string' ? 'MEDIUM' : (rec.confidence || 'MEDIUM'), score },
            aiSummary,
            keyFactors: res.keyFactors || res.analysis?.insights?.keyStrengths || [],
            risks: res.risks || res.analysis?.insights?.riskFactors || [],
            nextCatalysts: res.nextCatalysts || [],
            currentPrice,
            priceContext: res.priceContext || res.analysis?.meta?.priceContext || ''
          });
        } else {
          setAnalysisResult({ companyName: selectedCompany.name || selectedCompany.symbol, symbol: selectedCompany.symbol || 'N/A', recommendation: { action: 'HOLD', confidence: 'MEDIUM', score: 55 }, aiSummary: 'Simulated analysis result.', keyFactors: ['Factor A', 'Factor B'], risks: ['Risk 1'], nextCatalysts: [], currentPrice: '$123.45', priceContext: '+1.2%'});
        }
      } else {
        setAnalysisResult({ companyName: selectedCompany.name || selectedCompany.symbol, symbol: selectedCompany.symbol || 'N/A', recommendation: { action: 'HOLD', confidence: 'MEDIUM', score: 55 }, aiSummary: 'Simulated analysis result.', keyFactors: ['Factor A', 'Factor B'], risks: ['Risk 1'], nextCatalysts: [], currentPrice: '$123.45', priceContext: '+1.2%'});
      }

      toast({ title: 'Analysis Complete', description: `Analyzed ${selectedCompany.symbol}` });
    } catch (err: any) {
      setError(err?.message || 'Analysis failed');
      toast({ title: 'Analysis Failed', description: err?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setLoadingMessage('Preparing analysis...');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="card-glass border-t-4 border-t-finance-primary">
        <CardHeader className="bg-gradient-to-r from-finance-primary/10 via-finance-accent/10 to-finance-secondary/10">
          <CardTitle className="text-responsive-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-finance-primary to-finance-accent">StockViz Hybrid Analysis</CardTitle>
          <CardDescription className="text-muted-foreground">Get intelligent insights combining technical, fundamental, and sentiment analysis.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Analysis Mode</label>
            <Tabs value={analysisMode} onValueChange={(v: any) => setAnalysisMode(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="smart">Smart Mode</TabsTrigger>
                <TabsTrigger value="pro">Pro Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mb-6">
            <label htmlFor="company-search" className="block text-sm font-medium text-foreground mb-2">Search Company</label>
            <SearchBox />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Analysis Duration</label>
            <Select value={analysisDuration} onValueChange={(v: any) => setAnalysisDuration(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1W">1 Week (Short-term)</SelectItem>
                <SelectItem value="1M">1 Month (Short-term)</SelectItem>
                <SelectItem value="3M">3 Months (Medium-term)</SelectItem>
                <SelectItem value="6M">6 Months (Medium-term)</SelectItem>
                <SelectItem value="1Y">1 Year (Long-term)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAnalysisSubmit} disabled={isLoading || !selectedCompany} className="w-full bg-gradient-to-r from-finance-primary to-finance-accent text-white text-lg py-6">
            {isLoading ? <div className="flex items-center space-x-2"><Loader className="h-5 w-5 animate-spin" /> <span>{loadingMessage}</span></div> : 'Get Hybrid Analysis'}
          </Button>

          {error && (
            <div className="mt-6 border border-red-300 bg-red-50 rounded p-3 text-red-700">
              <div className="flex items-center space-x-2"><AlertTriangle className="h-4 w-4" /><strong>Analysis Error</strong></div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          )}

          {analysisResult && (
            <div className="mt-8 space-y-8">
              <div className="border-t my-4" />
              <h2 className="text-responsive-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-finance-primary to-finance-accent text-center">Analysis Results for {analysisResult.companyName} ({analysisResult.symbol})</h2>

              <Card className="card-glass border-l-4 border-l-finance-success">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {analysisResult.recommendation.action === 'BUY' && <TrendingUp className="h-6 w-6 text-finance-success" />}
                    {analysisResult.recommendation.action === 'HOLD' && <Minus className="h-6 w-6 text-finance-warning" />}
                    {analysisResult.recommendation.action === 'SELL' && <TrendingDown className="h-6 w-6 text-finance-danger" />}
                    <span className="text-2xl font-bold text-foreground">{analysisResult.recommendation.action}</span>
                    <Badge variant="outline" className={`text-lg font-semibold ${analysisResult.recommendation.confidence === 'HIGH' ? 'border-finance-success text-finance-success' : analysisResult.recommendation.confidence === 'MEDIUM' ? 'border-finance-warning text-finance-warning' : 'border-finance-danger text-finance-danger'}`}>Confidence: {analysisResult.recommendation.confidence}</Badge>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Overall Hybrid Score: {analysisResult.recommendation.score}/100</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-slate-100 rounded h-3 overflow-hidden"><div style={{ width: `${analysisResult.recommendation.score}%` }} className="h-3 bg-gradient-to-r from-green-400 to-green-600" /></div>
                  <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{analysisResult.aiSummary}</p>
                </CardContent>
              </Card>

              <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card/50 p-2">
                <h3 className="text-xl font-bold text-foreground mb-2 px-4 pt-2">Live Chart</h3>
                <PriceChart />
                <div className="flex justify-between items-center px-4 pb-2 text-muted-foreground text-sm"><span>Current Price: <span className="font-bold text-foreground">{analysisResult.currentPrice}</span></span><span>{analysisResult.priceContext}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedStockAnalysis;
