import { Activity, LineChart, Star } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const detailCards = [
  { icon: Activity, label: "Quote" },
  { icon: LineChart, label: "Price history" },
  { icon: Star, label: "Recommendations" },
];

export default function LoadingStockDetail() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </header>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Open", "High", "Low", "Volume"].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {detailCards.map(({ icon: Icon, label }) => (
          <section key={label} className="rounded-xl border bg-card p-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-muted p-2 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
