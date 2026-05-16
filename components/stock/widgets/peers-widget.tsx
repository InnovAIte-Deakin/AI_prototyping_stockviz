"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinnhubPeers } from "@/hooks/use-finnhub-stock-data"
import { cn } from "@/lib/utils"

type PeersWidgetProps = {
  symbol: string
  className?: string
}

export const PeersWidget = ({ symbol, className }: PeersWidgetProps) => {
  const { data, error, isLoading } = useFinnhubPeers(symbol)

  const peers = data ?? []

  return (
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#5f5e5e]">Peers</CardTitle>
        <CardDescription className="text-[#5a6060]">
          Companies in the same country and sector (Finnhub).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert className="border-[#fe8983]/30 bg-[#fe8983]/10 text-[#752121]">
            <AlertCircle className="text-[#752121]" />
            <AlertTitle className="font-bold">Peers unavailable</AlertTitle>
            <AlertDescription className="text-[#752121]/90">
              Industry peer data is currently unavailable due to API limits.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && peers.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Peer symbols">
            {peers.map((peer) => (
              <li key={peer}>
                <Badge asChild variant="outline" className="font-mono text-xs border-[#adb3b2]/30 bg-[#f2f4f3]/50 text-[#2d3433] hover:bg-[#e4e2e1] transition-colors">
                  <Link href={`/stock/${encodeURIComponent(peer)}`}>{peer}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !error && peers.length === 0 ? (
          <div className="rounded-lg border border-[#adb3b2]/10 bg-[#f9f9f8] p-4 text-center">
            <p className="text-sm font-bold text-[#5a6060]">No peers listed</p>
            <p className="text-xs text-[#adb3b2] mt-1">We couldn&apos;t find any direct industry peers for this symbol.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
