import { useQuery } from "@tanstack/react-query";

import { exchangeRatesService } from "@/services/exchange-rates.service";

export const exchangeRateHistoryQueryKey = (currency: string, days: number) =>
  ["exchange-rate-history", currency, days] as const;

export function useExchangeRateHistory(currency: string, days = 30) {
  return useQuery({
    queryKey: exchangeRateHistoryQueryKey(currency, days),
    queryFn: () => exchangeRatesService.getHistory(currency, days),
    enabled: Boolean(currency),
    staleTime: 5 * 60 * 1000,
  });
}
