import { useQuery } from "@tanstack/react-query";

import { exchangeRatesService } from "@/services/exchange-rates.service";

export const exchangeRatesQueryKey = ["exchange-rates"] as const;

export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRatesQueryKey,
    queryFn: exchangeRatesService.getRates,

    // A cotação fica "fresca" durante 30 segundos.
    staleTime: 30_000,

    // Atualiza automaticamente enquanto a página estiver aberta.
    refetchInterval: 30_000,
  });
}
