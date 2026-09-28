import { api } from "@/lib/api";
import type {
  ExchangeRate,
  ExchangeRateHistoryPoint,
} from "@/types/exchange-rate";

export const exchangeRatesService = {
  async getRates(): Promise<ExchangeRate[]> {
    const { data } = await api.get<ExchangeRate[]>("/exchange-rates");

    return data;
  },

  async getHistory(
    currency: string,
    days = 30,
  ): Promise<ExchangeRateHistoryPoint[]> {
    const { data } = await api.get<ExchangeRateHistoryPoint[]>(
      "/exchange-rates/history",
      {
        params: {
          currency,
          days,
        },
      },
    );

    return data;
  },
};
