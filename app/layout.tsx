import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import ShellFrame from '@/components/layout/shell-frame'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { WishlistProvider } from '@/components/providers/wishlist-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'



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
      className={`${geistMono.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${inter.className} min-h-full flex flex-col bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="stockviz-ui-theme"
          enableSystem
          disableTransitionOnChange
        >
          <WishlistProvider>
            <ShellFrame>{children}</ShellFrame>
          </WishlistProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
