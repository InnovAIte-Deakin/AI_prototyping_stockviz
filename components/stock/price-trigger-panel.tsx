"use client"

import * as React from "react"
import { Bell, TrendingUp, TrendingDown, Trash2, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createPriceTrigger, cancelPriceTrigger, getActiveTriggers } from "@/app/stock/[symbol]/trigger-actions"
import { toast } from "sonner"

type TriggerType = 'notify' | 'buy' | 'sell'
type TriggerCondition = 'above' | 'below'

interface PriceTrigger {
  id: string
  symbol: string
  trigger_price: number
  condition: TriggerCondition
  type: TriggerType
  shares: number | null
  status: 'active' | 'fired' | 'cancelled'
  created_at: string
}

interface PriceTriggerPanelProps {
  symbol: string
  currentPrice: number | null
}

export const PriceTriggerPanel = ({ symbol, currentPrice }: PriceTriggerPanelProps) => {
  const [triggers, setTriggers] = React.useState<PriceTrigger[]>([])
  const [isAdding, setIsAdding] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  // Form state
  const [price, setPrice] = React.useState("")
  const [type, setType] = React.useState<TriggerType>("notify")
  const [condition, setCondition] = React.useState<TriggerCondition>("above")
  const [shares, setShares] = React.useState("10")

  const fetchTriggers = React.useCallback(async () => {
    try {
      const data = await getActiveTriggers(symbol)
      setTriggers(data as PriceTrigger[])
    } catch (error) {
      console.error("Failed to fetch triggers:", error)
    }
  }, [symbol])

  React.useEffect(() => {
    fetchTriggers()
  }, [fetchTriggers])

  const handleAddTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createPriceTrigger({
        symbol,
        trigger_price: parseFloat(price),
        condition,
        type,
        shares: (type === 'buy' || type === 'sell') ? parseInt(shares) : undefined
      })

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} trigger set!`)
      setIsAdding(false)
      setPrice("")
      fetchTriggers()
    } catch (error) {
      toast.error("Failed to create trigger")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTrigger = async (id: string) => {
    try {
      await cancelPriceTrigger(id, symbol)
      toast.success("Trigger cancelled")
      fetchTriggers()
    } catch {
      toast.error("Failed to cancel trigger")
    }
  }

  return (
    <Card className="border-border/20 bg-card text-foreground shadow-md shadow-foreground/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">Price Triggers</CardTitle>
          <CardDescription className="text-xs">Set alerts or automated trades for {symbol}</CardDescription>
        </div>
        <Button
          size="sm"
          variant={isAdding ? "ghost" : "outline"}
          onClick={() => setIsAdding(!isAdding)}
          className="h-8 gap-1.5 font-bold"
        >
          {isAdding ? <Trash2 className="size-3.5" /> : <Plus className="size-3.5" />}
          {isAdding ? "Cancel" : "Add Trigger"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleAddTrigger} className="space-y-4 rounded-xl border border-border/20 bg-muted/20 p-4 transition-all animate-in fade-in slide-in-from-top-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Condition</label>
                <Select value={condition} onValueChange={(v: TriggerCondition) => setCondition(v)}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Price reaches or goes above</SelectItem>
                    <SelectItem value="below">Price reaches or goes below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={currentPrice?.toString() ?? "0.00"}
                  required
                  className="h-9 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Action Type</label>
                <Select value={type} onValueChange={(v: TriggerType) => setType(v)}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notify">Notify Me (Alert)</SelectItem>
                    <SelectItem value="buy">Auto Buy Shares</SelectItem>
                    <SelectItem value="sell">Auto Sell Shares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(type === 'buy' || type === 'sell') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount of Shares</label>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    required
                    className="h-9 bg-background"
                  />
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full h-9 font-bold">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              Set {type.charAt(0).toUpperCase() + type.slice(1)} Trigger
            </Button>
          </form>
        )}

        <div className="space-y-2">
          {triggers.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border/10 rounded-xl">
              <Bell className="size-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No active triggers for {symbol}</p>
              <p className="text-[10px] text-muted-foreground/60 max-w-[200px] mt-1">Set a price target to receive notifications or automate your trades.</p>
            </div>
          ) : (
            triggers.map((trigger) => (
              <div key={trigger.id} className="group flex items-center justify-between rounded-xl border border-border/10 bg-card p-3 transition-colors hover:border-border/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-9 items-center justify-center rounded-full border",
                    trigger.type === 'notify' ? "bg-primary/10 text-primary border-primary/20" :
                    trigger.type === 'buy' ? "bg-finance-success/10 text-finance-success border-finance-success/20" :
                    "bg-finance-danger/10 text-finance-danger border-finance-danger/20"
                  )}>
                    {trigger.type === 'notify' ? <Bell className="size-4" /> :
                     trigger.type === 'buy' ? <TrendingUp className="size-4" /> :
                     <TrendingDown className="size-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {trigger.condition === 'above' ? '≥' : '≤'} ${trigger.trigger_price.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold tracking-tighter">
                        {trigger.type}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {trigger.type === 'notify' ? 'Notification only' :
                       `${trigger.type === 'buy' ? 'Buy' : 'Sell'} ${trigger.shares} shares`}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleCancelTrigger(trigger.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
