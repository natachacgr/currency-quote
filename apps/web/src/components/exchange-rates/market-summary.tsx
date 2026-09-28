interface MarketSummaryProps {
  totalCurrencies?: number
}

export function MarketSummary({
  totalCurrencies,
}: MarketSummaryProps) {
  return (
    <section className="mt-10 grid overflow-hidden rounded-2xl border border-border/60 bg-card sm:grid-cols-3">
      <div className="border-b border-border/60 p-5 sm:border-b-0 sm:border-r">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Ativos monitorados
        </p>

        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {totalCurrencies ?? '—'}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Moedas internacionais
        </p>
      </div>

      <div className="border-b border-border/60 p-5 sm:border-b-0 sm:border-r">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Moeda base
        </p>

        <p className="mt-2 text-2xl font-semibold">
          BRL
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Real Brasileiro
        </p>
      </div>

      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Status dos dados
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-40" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>

          <p className="text-lg font-semibold">
            Online
          </p>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Atualização automática a cada 30s
        </p>
      </div>
    </section>
  )
}