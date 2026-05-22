import type { Metadata } from "next"

import { LearnExperience } from "@/components/learn/learn-experience"

export const metadata: Metadata = {
  title: "Learning Center",
  description:
    "Detailed explanations of valuation, momentum, chart reading, and paper trading using StockViz's learning modules.",
}

export default function LearnPage() {
  return <LearnExperience />
}
