"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Earning = {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  year: number;
  symbol: string;
};

export default function EarningsCalendarWidget({ symbol }: { symbol: string }) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [selected, setSelected] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/earnings-calendar?symbol=${symbol}`);
        const json = await res.json();
        setEarnings(json.earningsCalendar || []);
      } catch {
        setEarnings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [symbol]);

  const earningDates = earnings.map((e) => new Date(e.date));
  const selectedEarning = selected
    ? earnings.find((e) => new Date(e.date).toDateString() === selected.toDateString())
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Earnings Calendar — {symbol}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ earnings: earningDates }}
          modifiersClassNames={{ earnings: "bg-yellow-400 text-black font-bold rounded-full" }}
        />
        <div className="flex-1">
          {loading && <p className="text-muted-foreground text-sm">Loading...</p>}
          {!loading && !selectedEarning && (
            <p className="text-muted-foreground text-sm">Click a highlighted date to see earnings details.</p>
          )}
          {selectedEarning && (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">{selectedEarning.date}</p>
              <Badge variant="outline">Q{selectedEarning.quarter} {selectedEarning.year}</Badge>
              <p className="text-sm"><span className="text-muted-foreground">EPS Actual: </span>{selectedEarning.epsActual ?? "N/A"}</p>
              <p className="text-sm"><span className="text-muted-foreground">EPS Estimate: </span>{selectedEarning.epsEstimate ?? "N/A"}</p>
              <p className="text-sm"><span className="text-muted-foreground">Report Time: </span>{selectedEarning.hour === "bmo" ? "Before Market Open" : "After Market Close"}</p>
              {selectedEarning.epsActual !== null && selectedEarning.epsEstimate !== null && (
                <Badge className={selectedEarning.epsActual >= selectedEarning.epsEstimate ? "bg-green-600 text-white w-fit" : "bg-red-600 text-white w-fit"}>
                  {selectedEarning.epsActual >= selectedEarning.epsEstimate ? "Beat Estimate" : "Missed Estimate"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}