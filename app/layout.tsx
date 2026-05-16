import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import ShellFrame from '@/components/layout/shell-frame'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'StockViz - AI-Powered Stock Analysis Platform',
    template: '%s | StockViz',
  },
  description:
    'Comprehensive stock analysis with AI-powered insights, technical indicators, fundamental metrics, and sentiment analysis for intelligent investment decisions.',
  keywords: [
    'stock analysis',
    'AI insights',
    'technical indicators',
    'fundamental analysis',
    'sentiment analysis',
    'investment',
    'trading',
    'market data',
  ],
  openGraph: {
    title: 'StockViz - AI-Powered Stock Analysis Platform',
    description:
      'Comprehensive stock analysis with AI-powered insights, technical indicators, and sentiment analysis.',
    siteName: 'StockViz',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="stockviz-ui-theme"
          enableSystem
          disableTransitionOnChange
        >
          <ShellFrame>{children}</ShellFrame>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
