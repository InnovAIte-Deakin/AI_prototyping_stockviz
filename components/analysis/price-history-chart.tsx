"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OhlcvPoint = {
  date: string;
  close: number;
};

type PriceHistoryChartProps = {
  data: OhlcvPoint[];
};

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    }),
    close: Number(point.close.toFixed(2)),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stockviz-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5f5e5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5f5e5e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ece6e1" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(value: number) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              borderRadius: "14px",
              borderColor: "#d8d4d0",
              boxShadow: "0 10px 30px rgba(65, 59, 54, 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#5f5e5e"
            strokeWidth={2.2}
            fill="url(#stockviz-area)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
