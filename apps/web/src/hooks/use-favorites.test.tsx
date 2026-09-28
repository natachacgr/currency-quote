import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { favoritesQueryKey, useFavorites } from "@/hooks/use-favorites";
import { favoritesService } from "@/services/favorites.service";
import type { FavoriteCurrency } from "@/types/favorite";

vi.mock("@/services/favorites.service", () => ({
  favoritesService: {
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

const getFavoritesMock = vi.mocked(favoritesService.getFavorites);

const addFavoriteMock = vi.mocked(favoritesService.addFavorite);

const removeFavoriteMock = vi.mocked(favoritesService.removeFavorite);

function createTestEnvironment() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    queryClient,
    Wrapper,
  };
}

describe("useFavorites", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not fetch favorites when disabled", () => {
    const { Wrapper } = createTestEnvironment();

    const { result } = renderHook(() => useFavorites(false), {
      wrapper: Wrapper,
    });

    expect(result.current.favorites).toEqual([]);

    expect(getFavoritesMock).not.toHaveBeenCalled();
  });

  it("should return the authenticated user favorites", async () => {
    const favorites: FavoriteCurrency[] = [
      {
        id: "favorite-1",
        userId: "user-1",
        currencyId: "currency-usd",
        createdAt: "2026-09-28T12:00:00.000Z",
        currency: {
          id: "currency-usd",
          code: "USD",
          name: "Dólar Americano",
          createdAt: "2026-09-28T12:00:00.000Z",
          updatedAt: "2026-09-28T12:00:00.000Z",
        },
      },
    ];

    getFavoritesMock.mockResolvedValue(favorites);

    const { Wrapper } = createTestEnvironment();

    const { result } = renderHook(() => useFavorites(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.favorites).toEqual(favorites);
    });

    expect(getFavoritesMock).toHaveBeenCalledTimes(1);
  });

  it("should add a favorite and invalidate the favorites query", async () => {
    const favorite: FavoriteCurrency = {
      id: "favorite-1",
      userId: "user-1",
      currencyId: "currency-usd",
      createdAt: "2026-09-28T12:00:00.000Z",
      currency: {
        id: "currency-usd",
        code: "USD",
        name: "Dólar Americano",
        createdAt: "2026-09-28T12:00:00.000Z",
        updatedAt: "2026-09-28T12:00:00.000Z",
      },
    };

    getFavoritesMock.mockResolvedValue([]);
    addFavoriteMock.mockResolvedValue(favorite);

    const { queryClient, Wrapper } = createTestEnvironment();

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useFavorites(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(getFavoritesMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.addFavorite("USD");
    });

    await waitFor(() => {
      expect(addFavoriteMock).toHaveBeenCalledWith("USD");
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: favoritesQueryKey,
      });
    });
  });

  it("should remove a favorite and invalidate the favorites query", async () => {
    getFavoritesMock.mockResolvedValue([]);
    removeFavoriteMock.mockResolvedValue();

    const { queryClient, Wrapper } = createTestEnvironment();

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useFavorites(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(getFavoritesMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.removeFavorite("USD");
    });

    await waitFor(() => {
      expect(removeFavoriteMock).toHaveBeenCalledWith("USD");
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: favoritesQueryKey,
      });
    });
  });
});
