import type { Metadata } from "next";
import localFont from "next/font/local";
import ShellFrame from "@/components/layout/shell-frame";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-sans-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["Consolas", "monospace"],
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "StockViz - AI-Powered Stock Analysis Platform",
    template: "%s | StockViz",
  },
  description:
    "Comprehensive stock analysis with AI-powered insights, technical indicators, fundamental metrics, and sentiment analysis for intelligent investment decisions.",
  keywords: [
    "stock analysis",
    "AI insights",
    "technical indicators",
    "fundamental analysis",
    "sentiment analysis",
    "investment",
    "trading",
    "market data",
  ],
  openGraph: {
    title: "StockViz - AI-Powered Stock Analysis Platform",
    description:
      "Comprehensive stock analysis with AI-powered insights, technical indicators, and sentiment analysis.",
    siteName: "StockViz",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
          <WishlistProvider>
            <ShellFrame>{children}</ShellFrame>
          </WishlistProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
