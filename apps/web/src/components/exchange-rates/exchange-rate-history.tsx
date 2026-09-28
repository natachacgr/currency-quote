import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { ExchangeRateChart } from "@/components/exchange-rates/exchange-rate-chart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExchangeRateHistory } from "@/hooks/use-exchange-rate-history";

const currencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "ARS",
  "MXN",
] as const;

const periods = [
  { label: "7D", value: 7 },
  { label: "15D", value: 15 },
  { label: "30D", value: 30 },
  { label: "60D", value: 60 },
  { label: "3M", value: 90 },
  { label: "6M", value: 180 },
  { label: "1A", value: 360 },
] as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

export function ExchangeRateHistory() {
  const [currency, setCurrency] = useState("USD");
  const [days, setDays] = useState(30);

  const { data, isLoading, isError, isFetching, refetch } =
    useExchangeRateHistory(currency, days);

  const periodSummary = (() => {
    if (!data?.length) {
      return null;
    }

    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];

    const highest = Math.max(...data.map((point) => point.high));

    const lowest = Math.min(...data.map((point) => point.low));

    const variation =
      firstPoint.bid !== 0
        ? ((lastPoint.bid - firstPoint.bid) / firstPoint.bid) * 100
        : 0;

    return {
      current: lastPoint.bid,
      highest,
      lowest,
      variation,
    };
  })();

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Histórico
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Evolução da cotação
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe o comportamento das moedas em relação ao Real Brasileiro.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full rounded-xl sm:w-32.5">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {currencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {code} / BRL
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="max-w-full overflow-x-auto">
            <div className="flex min-w-max items-center rounded-xl border border-border/60 bg-muted/30 p-1">
              {periods.map((period) => {
                const isActive = days === period.value;

                return (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setDays(period.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold">{currency}</span>

                <span className="text-sm text-muted-foreground">/ BRL</span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Últimos {days} dias
              </p>
            </div>

            {isFetching && !isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="size-3.5 animate-spin" />
                Atualizando
              </div>
            )}
          </div>

          {periodSummary && (
            <div className="mt-6 flex flex-col gap-6 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cotação atual
                </p>

                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(periodSummary.current)}
                  </p>

                  <span
                    className={`mb-1 text-sm font-semibold tabular-nums ${
                      periodSummary.variation > 0
                        ? "text-emerald-500"
                        : periodSummary.variation < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {periodSummary.variation > 0 ? "+" : ""}
                    {periodSummary.variation.toFixed(2)}%
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Variação no período selecionado
                </p>
              </div>

              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Máxima</p>

                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatCurrency(periodSummary.highest)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Mínima</p>

                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatCurrency(periodSummary.lowest)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex h-90 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              Carregando histórico...
            </div>
          </div>
        )}

        {isError && (
          <div className="flex h-90 flex-col items-center justify-center text-center">
            <p className="font-semibold">
              Não foi possível carregar o histórico.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Tente novamente em alguns instantes.
            </p>

            <Button
              variant="outline"
              className="mt-5"
              onClick={() => void refetch()}
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {data && data.length > 0 && !isError && (
          <ExchangeRateChart data={data} />
        )}

        {data && data.length === 0 && !isError && (
          <div className="flex h-90 items-center justify-center text-sm text-muted-foreground">
            Nenhum dado histórico disponível para este período.
          </div>
        )}
      </div>
    </section>
  );
}
