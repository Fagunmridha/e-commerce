'use client'

import { RotateCcw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useLanguage } from '@/components/language-provider'
import { CatalogueTree } from '@/components/wholesale/catalogue-tree'
import { cn } from '@/lib/utils'
import type { Catalogue, Category, Product } from '@/lib/types'
import type { Localized } from '@/lib/i18n'
import type { MarketFilters } from '@/lib/wholesale/market-filters'

/** One tickable value and how many listings it would show. */
export type FacetOption = { value: string; label: string; count: number }

export type ColourOption = FacetOption & { hex?: string }

/** An admin-defined choice field, ready to draw. */
export type AttributeFacet = {
  id: string
  label: Localized
  options: FacetOption[]
}

/**
 * The market's filter panel — search, the catalogue tree, then every facet the
 * listings on sale actually support.
 *
 * A facet with nothing behind it is not drawn at all. Today's listings carry
 * sizes but no colours and no MRP, so there is no "Colour" block and no "Offers"
 * block; the moment a seller lists a navy shirt at below MRP, both appear. An
 * empty heading over no options reads as a page that failed to load, not as a
 * filter that has nothing to filter.
 *
 * One component, rendered twice — in the desktop sidebar and inside the mobile
 * sheet — so the two can never drift into different filters.
 */
export function MarketFilterPanel({
  filters,
  update,
  onReset,
  categories,
  catalogues,
  products,
  sizes,
  colours,
  attributes,
  priceBounds,
  showOffers,
  showStock,
}: {
  filters: MarketFilters
  update: (patch: Partial<MarketFilters>) => void
  onReset: () => void
  categories: Category[]
  catalogues: Catalogue[]
  /** Every listing — the tree's structure and counts, independent of facets. */
  products: Product[]
  sizes: FacetOption[]
  colours: ColourOption[]
  attributes: AttributeFacet[]
  priceBounds: [number, number]
  showOffers: boolean
  showStock: boolean
}) {
  const { t, pick, price: formatPrice } = useLanguage()
  const copy = t.wholesale.market
  const [floor, ceiling] = priceBounds
  const price = filters.price ?? priceBounds

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
      <Section title={copy.findProducts}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder={filters.category ? copy.searchInCategory : copy.search}
            className="h-9 pr-8 pl-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              aria-label={t.common.close}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </Section>

      {/* The tree is the category filter — trade line, category, catalogue, with
          the count beside every row. It keeps its own card chrome, so it sits
          here without a second heading on top of its own. */}
      <CatalogueTree
        categories={categories}
        catalogues={catalogues}
        products={products}
        category={filters.category}
        catalogue={filters.catalogue}
        onCategoryChange={(slug) => update({ category: slug, catalogue: '' })}
        onCatalogueChange={(slug) => update({ catalogue: slug })}
      />

      {sizes.length > 0 && (
        <Section title={copy.size}>
          <div className="space-y-2">
            {sizes.map((option) => (
              <TickRow
                key={option.value}
                label={option.label}
                count={option.count}
                checked={filters.sizes.includes(option.value)}
                onChange={() => update({ sizes: toggle(filters.sizes, option.value) })}
              />
            ))}
          </div>
        </Section>
      )}

      {colours.length > 0 && (
        <Section title={copy.colour}>
          <div className="flex flex-wrap gap-2">
            {colours.map((option) => {
              const on = filters.colours.includes(option.value)
              const label = `${option.label} (${option.count})`
              // A swatch where the seller gave a hex, a named chip where they
              // typed only a word — a guessed colour would be a lie on the card.
              return option.hex ? (
                <button
                  key={option.value}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={on}
                  onClick={() => update({ colours: toggle(filters.colours, option.value) })}
                  style={{ backgroundColor: option.hex }}
                  className={cn(
                    'size-7 rounded-full border border-border transition-shadow',
                    on && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  )}
                />
              ) : (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ colours: toggle(filters.colours, option.value) })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    on
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* Only when there is a range to narrow — one price is not a slider. */}
      {ceiling > floor && (
        <Section title={copy.price}>
          <Slider
            min={floor}
            max={ceiling}
            step={1}
            value={price}
            onValueChange={(next) =>
              update({
                price:
                  next[0] <= floor && next[1] >= ceiling
                    ? null
                    : [next[0], next[1]],
              })
            }
            className="py-2"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {formatPrice(price[0])} – {formatPrice(price[1])}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PriceInput
              value={price[0]}
              onCommit={(value) =>
                update({ price: [Math.min(Math.max(value, floor), price[1]), price[1]] })
              }
            />
            <PriceInput
              value={price[1]}
              onCommit={(value) =>
                update({ price: [price[0], Math.max(Math.min(value, ceiling), price[0])] })
              }
            />
          </div>
        </Section>
      )}

      {attributes.map((facet) => (
        <Section key={facet.id} title={pick(facet.label)}>
          <div className="space-y-2">
            {facet.options.map((option) => {
              const ticked = filters.attributes[facet.id] ?? []
              return (
                <TickRow
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  checked={ticked.includes(option.value)}
                  onChange={() =>
                    update({
                      attributes: {
                        ...filters.attributes,
                        [facet.id]: toggle(ticked, option.value),
                      },
                    })
                  }
                />
              )
            })}
          </div>
        </Section>
      ))}

      {showOffers && (
        <Section title={copy.offers}>
          <TickRow
            label={copy.onlyOffers}
            checked={filters.offersOnly}
            onChange={() => update({ offersOnly: !filters.offersOnly })}
          />
        </Section>
      )}

      {showStock && (
        <Section title={copy.stock}>
          <TickRow
            label={copy.onlyInStock}
            checked={filters.inStockOnly}
            onChange={() => update({ inStockOnly: !filters.inStockOnly })}
          />
        </Section>
      )}

      <Button className="w-full" onClick={onReset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        {copy.resetFilters}
      </Button>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="mb-2.5 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function TickRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string
  count?: number
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          ({count})
        </span>
      )}
    </label>
  )
}

/**
 * A price box that applies on blur or Enter, not on every keystroke — typing
 * "5000" would otherwise filter the grid through 5, 50 and 500 on the way.
 */
function PriceInput({
  value,
  onCommit,
}: {
  value: number
  onCommit: (value: number) => void
}) {
  const commit = (raw: string) => {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) onCommit(Math.round(parsed))
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
        ৳
      </span>
      <Input
        key={value}
        type="number"
        min={0}
        defaultValue={value}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget.value)
        }}
        className="h-9 pl-6 text-xs"
      />
    </div>
  )
}
