import {
  ArrowDownRight,
  ArrowUpRight,
  LoaderCircle,
  Minus,
  Star,
} from 'lucide-react'

import type { ExchangeRate } from '@/types/exchange-rate'

interface ExchangeRateCardProps {
  rate: ExchangeRate
  isFavorite?: boolean
  isFavoritePending?: boolean
  onFavoriteToggle?: (currencyCode: string) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatCurrencyName(name: string): string {
  return name.split('/')[0]?.trim() ?? name
}

function formatVariation(value: number): string {
  return `${Math.abs(value).toFixed(2)}%`
}

export function ExchangeRateCard({
  rate,
  isFavorite = false,
  isFavoritePending = false,
  onFavoriteToggle,
}: ExchangeRateCardProps) {
  const isPositive = rate.variation > 0
  const isNegative = rate.variation < 0

  const variationClassName = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground'

  const favoriteTitle = isFavorite
    ? 'Remover dos favoritos'
    : 'Adicionar aos favoritos'

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">
              {rate.code}
            </span>

            <span className="text-sm text-muted-foreground">
              / BRL
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrencyName(rate.name)}
          </p>
        </div>

        <button
          type="button"
          disabled={isFavoritePending}
          onClick={() => onFavoriteToggle?.(rate.code)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${favoriteTitle}: ${rate.code}`}
          title={favoriteTitle}
        >
          {isFavoritePending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Star
              className={`size-4 transition-colors ${
                isFavorite
                  ? 'fill-amber-400 text-amber-400'
                  : ''
              }`}
            />
          )}
        </button>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Cotação atual
        </p>

        <div className="mt-1.5 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(rate.bid)}
          </p>

          <div
            className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${variationClassName}`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-4" />
            ) : isNegative ? (
              <ArrowDownRight className="size-4" />
            ) : (
              <Minus className="size-4" />
            )}

            {formatVariation(rate.variation)}
          </div>
        </div>
      </div>

      <div className="my-5 h-px bg-border/60" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Compra
          </p>

          <p className="mt-1 text-sm font-medium tabular-nums">
            {formatCurrency(rate.bid)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Venda
          </p>

          <p className="mt-1 text-sm font-medium tabular-nums">
            {formatCurrency(rate.ask)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Máxima
          </p>

          <p className="mt-1 text-sm font-medium tabular-nums">
            {formatCurrency(rate.high)}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Mínima
          </p>

          <p className="mt-1 text-sm font-medium tabular-nums">
            {formatCurrency(rate.low)}
          </p>
        </div>
      </div>
    </article>
  )
}