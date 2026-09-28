import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoritesService } from "@/services/favorites.service";

export const favoritesQueryKey = ["favorites"] as const;

export function useFavorites(enabled = true) {
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: favoritesService.getFavorites,
    enabled,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: (currencyCode: string) =>
      favoritesService.addFavorite(currencyCode),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: favoritesQueryKey,
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (currencyCode: string) =>
      favoritesService.removeFavorite(currencyCode),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: favoritesQueryKey,
      });
    },
  });

  return {
    favorites: favoritesQuery.data ?? [],
    isLoading: favoritesQuery.isLoading,
    isError: favoritesQuery.isError,

    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,

    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
  };
}
