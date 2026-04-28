"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from "recharts";
import type { MonthlyInventorySnapshot } from "@/types";

type Props = {
  snapshots: MonthlyInventorySnapshot[];
};

type ChartPoint = {
  month: string;
  high: number;
  low: number;
  ending: number;
  trend: number;
};

function movingAverage(values: number[], index: number, window = 3): number {
  const start = Math.max(0, index - (window - 1));
  const slice = values.slice(start, index + 1);
  const avg = slice.reduce((sum, v) => sum + v, 0) / slice.length;
  return Number(avg.toFixed(1));
}

function buildChartData(snapshots: MonthlyInventorySnapshot[]): ChartPoint[] {
  const endingValues = snapshots.map((s) => s.activity.endingInventory);
  return snapshots.map((snapshot, index) => {
    const start = snapshot.activity.startingInventory;
    const end = snapshot.activity.endingInventory;
    const [year, month] = snapshot.monthKey.split("-");
    const mmYyy = `${month}-${year.slice(1)}`;
    return {
      month: mmYyy,
      high: Math.max(start, end),
      low: Math.min(start, end),
      ending: end,
      trend: movingAverage(endingValues, index),
    };
  });
}

export function InventoryHistoryChart({ snapshots }: Props) {
  const data = buildChartData(snapshots);

  return (
    <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-[var(--atlantic-navy)] text-lg sm:text-xl">
          Inventory Range by Month
        </h2>
        <p className="text-xs sm:text-sm text-[var(--nantucket-gray)] mt-1">
          Band shows monthly high/low between starting and ending inventory. Line shows ending inventory; dashed line is 3-month trend.
        </p>
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6D7380" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6D7380" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid rgba(109,131,163,0.25)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "high") return [value, "Monthly High"];
                if (name === "low") return [value, "Monthly Low"];
                if (name === "ending") return [value, "Ending Inventory"];
                return [value, "Trend (3-mo avg)"];
              }}
            />

            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="#8DE1FF"
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="ending"
              stroke="#074059"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: "#074059" }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="#15A5E5"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
