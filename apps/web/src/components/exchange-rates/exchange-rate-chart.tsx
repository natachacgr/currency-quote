import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExchangeRateHistoryPoint } from "@/types/exchange-rate";

interface ExchangeRateChartProps {
  data: ExchangeRateHistoryPoint[];
}

interface TooltipPayload {
  value: number;
  payload: {
    timestamp: string;
    bid: number;
    high: number;
    low: number;
    variation: number;
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function formatFullDate(timestamp: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  const variationClassName =
    point.variation > 0
      ? "text-emerald-500"
      : point.variation < 0
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="min-w-48 rounded-xl border border-border/60 bg-popover/95 p-3 shadow-xl backdrop-blur">
      <p className="text-xs text-muted-foreground">
        {formatFullDate(point.timestamp)}
      </p>

      <p className="mt-2 text-lg font-semibold tabular-nums">
        {formatCurrency(point.bid)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/60 pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Máxima</p>

          <p className="text-xs font-medium tabular-nums">
            {formatCurrency(point.high)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Mínima</p>

          <p className="text-xs font-medium tabular-nums">
            {formatCurrency(point.low)}
          </p>
        </div>
      </div>

      <p className={`mt-3 text-xs font-semibold ${variationClassName}`}>
        {point.variation > 0 ? "+" : ""}
        {point.variation.toFixed(2)}%
      </p>
    </div>
  );
}

export function ExchangeRateChart({ data }: ExchangeRateChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    date: formatDate(point.timestamp),
  }));

  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];

  const isPositive =
    firstPoint && lastPoint ? lastPoint.bid >= firstPoint.bid : true;

  const chartColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <div className="h-90 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="exchangeRateGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />

              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            opacity={0.08}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            minTickGap={30}
            fontSize={11}
            stroke="currentColor"
            opacity={0.5}
          />

          <YAxis
            dataKey="bid"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={65}
            fontSize={11}
            stroke="currentColor"
            opacity={0.5}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => value.toFixed(2)}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "4 4",
              opacity: 0.2,
            }}
          />

          <Area
            type="monotone"
            dataKey="bid"
            stroke={chartColor}
            strokeWidth={2.5}
            fill="url(#exchangeRateGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: chartColor,
              stroke: "var(--background)",
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
