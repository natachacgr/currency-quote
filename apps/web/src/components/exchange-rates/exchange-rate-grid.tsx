import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/use-auth";
import { ExchangeRateCard } from "@/components/exchange-rates/exchange-rate-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import type { ExchangeRate } from "@/types/exchange-rate";

interface ExchangeRateGridProps {
  rates: ExchangeRate[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ExchangeRateGrid({
  rates,
  isLoading,
  isError,
  onRetry,
}: ExchangeRateGridProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    favorites,
    addFavorite,
    removeFavorite,
    isAddingFavorite,
    isRemovingFavorite,
  } = useFavorites(isAuthenticated);

  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  const favoriteCodes = useMemo(
    () => new Set(favorites.map((favorite) => favorite.currency.code)),
    [favorites],
  );

  const orderedRates = useMemo(() => {
    if (!isAuthenticated) {
      return rates;
    }

    return [...rates].sort((a, b) => {
      const aIsFavorite = favoriteCodes.has(a.code);
      const bIsFavorite = favoriteCodes.has(b.code);

      if (aIsFavorite === bIsFavorite) {
        return 0;
      }

      return aIsFavorite ? -1 : 1;
    });
  }, [rates, favoriteCodes, isAuthenticated]);

  function handleFavoriteToggle(currencyCode: string) {
    if (!isAuthenticated) {
      void navigate("/login");
      return;
    }

    if (isAddingFavorite || isRemovingFavorite) {
      return;
    }

    setPendingCurrency(currencyCode);

    if (favoriteCodes.has(currencyCode)) {
      removeFavorite(currencyCode, {
        onSettled: () => setPendingCurrency(null),
      });
    } else {
      addFavorite(currencyCode, {
        onSettled: () => setPendingCurrency(null),
      });
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
        <p className="font-semibold">Não foi possível carregar o mercado.</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>

        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <Search className="mx-auto size-6 text-muted-foreground" />

        <p className="mt-4 font-semibold">Nenhuma moeda encontrada</p>

        <p className="mt-1 text-sm text-muted-foreground">
          Tente buscar por outro código ou nome de moeda.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orderedRates.map((rate) => (
        <ExchangeRateCard
          key={rate.code}
          rate={rate}
          isFavorite={favoriteCodes.has(rate.code)}
          isFavoritePending={pendingCurrency === rate.code}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
    </div>
  );
}
