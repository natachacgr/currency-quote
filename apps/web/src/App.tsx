import { ExchangeRateHistory } from "@/components/exchange-rates/exchange-rate-history";
import { ExchangeRateSection } from "@/components/exchange-rates/exchange-rate-section";
import { MarketOverview } from "@/components/exchange-rates/market-overview";
import { MarketSummary } from "@/components/exchange-rates/market-summary";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { useMarketFilters } from "@/hooks/use-market-filters";

function App() {
  const {
    data: rates,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useExchangeRates();

  const { search, setSearch, sortBy, setSortBy, displayedRates } =
    useMarketFilters(rates);

  const lastUpdate = dataUpdatedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(dataUpdatedAt))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <MarketOverview
          isFetching={isFetching}
          lastUpdate={lastUpdate}
          onRefresh={() => void refetch()}
        />

        <MarketSummary totalCurrencies={rates?.length} />

        <ExchangeRateSection
          rates={displayedRates}
          search={search}
          sortBy={sortBy}
          isLoading={isLoading}
          isError={isError}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onRetry={() => void refetch()}
        />

        <ExchangeRateHistory />

        <Footer />
      </main>
    </div>
  );
}

export default App;
