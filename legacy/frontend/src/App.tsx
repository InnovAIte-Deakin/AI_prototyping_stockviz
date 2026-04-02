import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import OnboardingPopup from './components/OnboardingPopup'
import Home from './pages/Home'
import SymbolAnalysis from './pages/SymbolAnalysis'
import AnalysisResultsPage from './pages/AnalysisResultsPage'
import Indicators from './pages/Indicators'
import Weights from './pages/Weights'
import Market from './pages/Market'
import Portfolio from './pages/Portfolio'
import LearnPage from './pages/LearnPage'
import Admin from './pages/Admin'
import UIShowcase from './components/UIShowcase'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="stockviz-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/symbol/:symbol" element={<SymbolAnalysis />} />
                <Route path="/analysis/:symbol" element={<AnalysisResultsPage />} />
                <Route path="/indicators" element={<Indicators />} />
                <Route path="/weights" element={<Weights />} />
                <Route path="/market" element={<Market />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/showcase" element={<UIShowcase />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <OnboardingPopup />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
