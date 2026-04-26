import { LoaderCircle } from "lucide-react";

const scoreCards = ["Overall", "Fundamental", "Technical", "Sentiment"];

export default function LoadingAnalysis() {
  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-8 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[28px] border border-[#e6e0db] bg-white p-7 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[#6a706f]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Opening analysis
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="h-3 w-44 rounded-full bg-[#eee8e3]" />
              <div className="h-12 max-w-xl rounded-2xl bg-[#f1ece8]" />
              <div className="h-5 max-w-2xl rounded-full bg-[#f4efeb]" />
              <div className="flex flex-wrap gap-2 pt-2">
                {["1D", "1W", "1M", "3M", "6M", "1Y", "2Y"].map((item) => (
                  <div
                    key={item}
                    className="h-10 w-14 rounded-xl bg-[#f4efeb]"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
              <div className="h-4 w-36 rounded-full bg-[#e9e2dc]" />
              <div className="mt-3 h-12 rounded-xl bg-white" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((label) => (
            <div
              key={label}
              className="rounded-[22px] border border-[#e6e0db] bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="h-4 w-24 rounded-full bg-[#f1ece8]" />
                <div className="h-9 w-9 rounded-2xl bg-[#f1ece8]" />
              </div>
              <div className="h-10 w-20 rounded-2xl bg-[#f4efeb]" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="h-80 rounded-[24px] border border-[#e6e0db] bg-white shadow-[0_12px_32px_rgba(55,49,45,0.04)]" />
          <div className="h-80 rounded-[24px] border border-[#e6e0db] bg-white shadow-[0_12px_32px_rgba(55,49,45,0.04)]" />
        </div>
      </div>
    </div>
  );
}
