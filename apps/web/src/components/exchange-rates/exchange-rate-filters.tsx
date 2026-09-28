import { ArrowUpDown, Search } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SortOption =
  | 'default'
  | 'code-asc'
  | 'code-desc'
  | 'price-desc'
  | 'price-asc'
  | 'variation-desc'
  | 'variation-asc'

interface ExchangeRateFiltersProps {
  search: string
  sortBy: SortOption
  onSearchChange: (value: string) => void
  onSortChange: (value: SortOption) => void
}

export function ExchangeRateFilters({
  search,
  sortBy,
  onSearchChange,
  onSortChange,
}: ExchangeRateFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Buscar por código ou moeda..."
          aria-label="Buscar moeda"
          className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <Select
        value={sortBy}
        onValueChange={(value) =>
          onSortChange(value as SortOption)
        }
      >
        <SelectTrigger className="h-10 w-full rounded-xl sm:w-52.5">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground" />

            <SelectValue placeholder="Ordenar por" />
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="default">
            Ordem padrão
          </SelectItem>

          <SelectItem value="code-asc">
            Código: A → Z
          </SelectItem>

          <SelectItem value="code-desc">
            Código: Z → A
          </SelectItem>

          <SelectItem value="price-desc">
            Maior cotação
          </SelectItem>

          <SelectItem value="price-asc">
            Menor cotação
          </SelectItem>

          <SelectItem value="variation-desc">
            Maior variação
          </SelectItem>

          <SelectItem value="variation-asc">
            Menor variação
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}