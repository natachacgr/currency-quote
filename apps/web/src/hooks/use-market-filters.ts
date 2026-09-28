import { useMemo, useState } from 'react'

import type { SortOption } from '@/components/exchange-rates/exchange-rate-filters'
import type { ExchangeRate } from '@/types/exchange-rate'

export function useMarketFilters(rates?: ExchangeRate[]) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('default')

  const displayedRates = useMemo(() => {
    if (!rates) {
      return []
    }

    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase('pt-BR')

    const filteredRates = rates.filter((rate) => {
      if (!normalizedSearch) {
        return true
      }

      const currencyName =
        rate.name.split('/')[0]?.trim() ?? rate.name

      return (
        rate.code
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch) ||
        currencyName
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch)
      )
    })

    const sortedRates = [...filteredRates]

    switch (sortBy) {
      case 'code-asc':
        return sortedRates.sort((a, b) =>
          a.code.localeCompare(b.code),
        )

      case 'code-desc':
        return sortedRates.sort((a, b) =>
          b.code.localeCompare(a.code),
        )

      case 'price-desc':
        return sortedRates.sort(
          (a, b) => b.bid - a.bid,
        )

      case 'price-asc':
        return sortedRates.sort(
          (a, b) => a.bid - b.bid,
        )

      case 'variation-desc':
        return sortedRates.sort(
          (a, b) => b.variation - a.variation,
        )

      case 'variation-asc':
        return sortedRates.sort(
          (a, b) => a.variation - b.variation,
        )

      case 'default':
      default:
        return sortedRates
    }
  }, [rates, search, sortBy])

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    displayedRates,
  }
}