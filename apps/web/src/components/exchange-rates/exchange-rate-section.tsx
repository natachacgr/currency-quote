import { ExchangeRateFilters } from "@/components/exchange-rates/exchange-rate-filters";
import type { SortOption } from "@/components/exchange-rates/exchange-rate-filters";
import { ExchangeRateGrid } from "@/components/exchange-rates/exchange-rate-grid";
import type { ExchangeRate } from "@/types/exchange-rate";

interface ExchangeRateSectionProps {
  rates: ExchangeRate[];
  search: string;
  sortBy: SortOption;
  isLoading: boolean;
  isError: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onRetry: () => void;
}

export function ExchangeRateSection({
  rates,
  search,
  sortBy,
  isLoading,
  isError,
  onSearchChange,
  onSortChange,
  onRetry,
}: ExchangeRateSectionProps) {
  return (
    <section className="mt-12">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Visão do mercado
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Principais moedas
          </h2>
        </div>

        <ExchangeRateFilters
          search={search}
          sortBy={sortBy}
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
        />
      </div>

      <div className="mt-6">
        <ExchangeRateGrid
          rates={rates}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
        />
      </div>
    </section>
  );
}
