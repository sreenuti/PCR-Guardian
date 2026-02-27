"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const POLL_MS = 1000;
const DAILY_RATE = 50;
const PROJECTION_DAYS = 30;

type ChartPoint = {
  label: string;
  projectedTotal: number;
};

export function LiveFineMeter({ initialTotal }: { initialTotal: number }) {
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    let cancelled = false;
    const fetchTotal = async () => {
      try {
        const res = await fetch("/api/live-balance");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setTotal(data.total ?? 0);
      } catch {
        // ignore
      }
    };

    setTotal(initialTotal);
    const id = setInterval(fetchTotal, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [initialTotal]);

  const chartData: ChartPoint[] = useMemo(() => {
    return Array.from({ length: PROJECTION_DAYS + 1 }, (_, day) => ({
      label: day === 0 ? "Today" : `+${day}d`,
      projectedTotal: total + day * DAILY_RATE,
    }));
  }, [total]);

  return (
    <div
      className="mb-6 rounded-xl border border-primary/30 bg-white/90 p-6 shadow-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        Live fine meter
      </p>
      <p className="text-4xl font-bold tabular-nums text-sky-900">
        ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
      <p className="mt-1 text-xs font-medium text-sky-700">
        +$50/day until cure
      </p>

      <div className="mt-5 h-48 rounded-md bg-sky-50/60 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-900/80">
          30-day projection
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#93c5fd" }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${v}`}
              tickLine={false}
              axisLine={{ stroke: "#93c5fd" }}
            />
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              }
            />
            <Line
              type="monotone"
              dataKey="projectedTotal"
              stroke="#0284c7"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
