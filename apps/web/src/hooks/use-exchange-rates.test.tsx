import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { exchangeRatesService } from "@/services/exchange-rates.service";
import type { ExchangeRate } from "@/types/exchange-rate";

vi.mock("@/services/exchange-rates.service", () => ({
  exchangeRatesService: {
    getRates: vi.fn(),
  },
}));

const getRatesMock = vi.mocked(exchangeRatesService.getRates);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useExchangeRates", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start in a pending state while rates are loading", async () => {
    let resolveRates: ((rates: ExchangeRate[]) => void) | undefined;

    getRatesMock.mockImplementation(
      () =>
        new Promise<ExchangeRate[]>((resolve) => {
          resolveRates = resolve;
        }),
    );

    const { result } = renderHook(() => useExchangeRates(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await act(async () => {
      resolveRates?.([]);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should return exchange rates from the service", async () => {
    const rates: ExchangeRate[] = [
      {
        code: "USD",
        codeIn: "BRL",
        name: "Dólar Americano/Real Brasileiro",
        high: 5.35,
        low: 5.25,
        bid: 5.3,
        ask: 5.31,
        variation: 0.5,
        timestamp: "2026-09-28T12:00:00.000Z",
      },
      {
        code: "EUR",
        codeIn: "BRL",
        name: "Euro/Real Brasileiro",
        high: 6.3,
        low: 6.2,
        bid: 6.25,
        ask: 6.26,
        variation: -0.2,
        timestamp: "2026-09-28T12:00:00.000Z",
      },
    ];

    getRatesMock.mockResolvedValue(rates);

    const { result } = renderHook(() => useExchangeRates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(rates);

    expect(getRatesMock).toHaveBeenCalledTimes(1);
  });

  it("should expose an error when the service fails", async () => {
    const error = new Error("Failed to fetch exchange rates");

    getRatesMock.mockRejectedValue(error);

    const { result } = renderHook(() => useExchangeRates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    expect(getRatesMock).toHaveBeenCalledTimes(1);
  });
});
