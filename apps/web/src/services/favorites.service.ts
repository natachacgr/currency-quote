import { api } from '@/lib/api'
import type { FavoriteCurrency } from '@/types/favorite'

export const favoritesService = {
  async getFavorites(): Promise<FavoriteCurrency[]> {
    const { data } = await api.get<FavoriteCurrency[]>(
      '/favorites',
    )

    return data
  },

  async addFavorite(
    currencyCode: string,
  ): Promise<FavoriteCurrency> {
    const { data } = await api.post<FavoriteCurrency>(
      `/favorites/${currencyCode}`,
    )

    return data
  },

  async removeFavorite(
    currencyCode: string,
  ): Promise<void> {
    await api.delete(`/favorites/${currencyCode}`)
  },
}