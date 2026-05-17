import { CompareClientView } from "./compare-client-view"

export const metadata = {
  title: "Compare Stocks | StockViz",
  description: "Compare multiple stocks and get AI insights.",
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-accent selection:text-accent-foreground">
      <CompareClientView />
    </div>
  )
}
