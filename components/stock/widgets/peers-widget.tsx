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
    <Card className={cn("border-border/20 bg-card text-foreground shadow-md shadow-foreground/5", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary">Peers</CardTitle>
        <CardDescription className="text-muted-foreground">
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
          <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
            <AlertCircle className="text-destructive" />
            <AlertTitle className="font-bold">Peers unavailable</AlertTitle>
            <AlertDescription className="text-destructive/90">
              Industry peer data is currently unavailable due to API limits.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && peers.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Peer symbols">
            {peers.map((peer) => (
              <li key={peer}>
                <Badge asChild variant="outline" className="font-mono text-xs border-border/30 bg-muted/50 text-foreground hover:bg-accent transition-colors">
                  <Link href={`/stock/${encodeURIComponent(peer)}`}>{peer}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !error && peers.length === 0 ? (
          <div className="rounded-lg border border-border/10 bg-background p-4 text-center">
            <p className="text-sm font-bold text-muted-foreground">No peers listed</p>
            <p className="text-xs text-muted-foreground mt-1">We couldn&apos;t find any direct industry peers for this symbol.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
