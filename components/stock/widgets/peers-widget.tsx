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
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Peers</CardTitle>
        <CardDescription>
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
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load peers</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && peers.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Peer symbols">
            {peers.map((peer) => (
              <li key={peer}>
                <Badge asChild variant="outline" className="font-mono text-xs">
                  <Link href={`/stock/${encodeURIComponent(peer)}`}>{peer}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !error && peers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No peers listed.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
