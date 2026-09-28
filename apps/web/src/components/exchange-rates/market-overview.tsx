import {
  Activity,
  Clock3,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface MarketOverviewProps {
  isFetching: boolean
  lastUpdate: string | null
  onRefresh: () => void
}

export function MarketOverview({
  isFetching,
  lastUpdate,
  onRefresh,
}: MarketOverviewProps) {
  return (
    <section>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5">
              <Activity className="size-3.5 text-emerald-500" />

              <span className="text-xs font-medium">
                Mercado global
              </span>
            </div>

            <span className="text-xs text-muted-foreground">
              BRL
            </span>
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Cotações em tempo real.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Monitore as principais moedas globais
            frente ao Real Brasileiro em uma única
            plataforma.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={onRefresh}
            className="rounded-xl"
          >
            <RefreshCw
              className={
                isFetching
                  ? 'size-4 animate-spin'
                  : 'size-4'
              }
            />

            {isFetching
              ? 'Atualizando'
              : 'Atualizar mercado'}
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />

            {lastUpdate
              ? `Atualizado às ${lastUpdate}`
              : 'Aguardando atualização'}
          </div>
        </div>
      </div>
    </section>
  )
}