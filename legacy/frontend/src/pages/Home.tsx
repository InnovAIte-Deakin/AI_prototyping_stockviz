import SearchBox from '../components/SearchBox'
import TrendingTabs from '../components/TrendingTabs'
import EnhancedStockAnalysis from '@/components/EnhancedStockAnalysis'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">StockViz Analytics</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get comprehensive stock analysis with AI-powered insights, technical indicators, and sentiment analysis
        </p>
        <SearchBox />
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-lg border">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Technical Analysis</h3>
          <p className="text-gray-600 text-sm">Advanced technical indicators and chart patterns for informed trading decisions</p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg border">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Fundamental Analysis</h3>
          <p className="text-gray-600 text-sm">Deep dive into company financials, ratios, and valuation metrics</p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg border">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
          <p className="text-gray-600 text-sm">Machine learning-powered sentiment analysis and market predictions</p>
        </div>
      </section>

      {/* Trending Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Market Trending</h2>
          <span className="text-sm text-gray-500">Live market data</span>
        </div>
        <TrendingTabs />
      </section>

      {/* Hybrid Analysis Section (from updated-UI) */}
      <section className="mt-8">
        <EnhancedStockAnalysis />
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to start analyzing?</h3>
        <p className="text-gray-300 mb-6">Enter any stock symbol above to get started with comprehensive analysis</p>
        <div className="flex justify-center gap-4">
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">AAPL</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">TSLA</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">GOOGL</span>
          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">MSFT</span>
        </div>
      </section>
    </div>
  )
}
