import { Globe, Newspaper, TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const signalIcons = [Globe, Newspaper, TrendingUp];

export default function LoadingMarket() {
  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-10 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[30px] border border-[#e6e0db] bg-white p-8 shadow-[0_24px_64px_rgba(55,49,45,0.07)]">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-24 rounded-full bg-[#eef4f1]" />
                <Skeleton className="h-7 w-40 rounded-full bg-[#f5f1ee]" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-3 w-44 rounded-full bg-[#eee8e3]" />
                <Skeleton className="h-14 max-w-3xl rounded-2xl bg-[#f1ece8]" />
                <Skeleton className="h-5 max-w-2xl rounded-full bg-[#f4efeb]" />
                <Skeleton className="h-5 max-w-xl rounded-full bg-[#f4efeb]" />
              </div>
              <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
                <Skeleton className="mb-4 h-4 w-40 rounded-full bg-[#e9e2dc]" />
                <Skeleton className="h-12 w-full rounded-xl bg-white" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-11 w-40 rounded-xl bg-[#e4e2e1]" />
                <Skeleton className="h-11 w-44 rounded-xl bg-[#f2efec]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {signalIcons.map((Icon, index) => (
                <div
                  key={index}
                  className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-[#5f5e5e] shadow-[0_10px_24px_rgba(55,49,45,0.05)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Skeleton className="h-5 w-32 rounded-full bg-[#ece6e1]" />
                  <Skeleton className="mt-3 h-4 w-full rounded-full bg-[#f1ece8]" />
                  <Skeleton className="mt-2 h-4 w-4/5 rounded-full bg-[#f1ece8]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Skeleton className="h-80 rounded-[28px] border border-[#e6e0db] bg-white" />
          <Skeleton className="h-80 rounded-[28px] border border-[#e6e0db] bg-white" />
        </section>

        <section className="space-y-4">
          <Skeleton className="h-4 w-44 rounded-full bg-[#eee8e3]" />
          <Skeleton className="h-10 max-w-3xl rounded-2xl bg-[#f1ece8]" />
          <Skeleton className="h-96 rounded-[28px] border border-[#e6e0db] bg-white" />
        </section>
      </div>
    </div>
  );
}
