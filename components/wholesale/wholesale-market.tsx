'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { ProductCard } from '@/components/product-card'
import { CatalogueFilter } from '@/components/catalogue-filter'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'

/**
 * The market as a joined buyer sees it — the one place trade stock is
 * orderable.
 *
 * There is no "sell your own stock" call to action here any more. A seller
 * cannot reach this page at all (the gate in the route's layout turns them
 * away), so the only person reading it is someone who chose the buying side
 * and cannot list anything.
 */
export function WholesaleMarket() {
  const { t, pick } = useLanguage()
  const { wholesaleProducts, categories, catalogues } = useCatalogue()
  const copy = t.wholesale.market

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [catalogue, setCatalogue] = useState('')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return wholesaleProducts.filter(
      (product) =>
        (!category || product.category === category) &&
        (!catalogue || product.catalogue === catalogue) &&
        // Product names only. The shop behind a listing is never shown to a
        // buyer, so searching by it would leak the very thing that is hidden.
        (!term || pick(product.name).toLowerCase().includes(term)),
    )
  }, [wholesaleProducts, search, category, catalogue, pick])

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <div className="mb-8">
        <Badge variant="secondary" className="border-0">
          {copy.badge}
        </Badge>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {copy.subtitle}
        </p>
      </div>

      {wholesaleProducts.length === 0 ? (
        <Empty className="rounded-lg border border-border">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyBody}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.search}
                className="pl-9"
              />
            </div>
            <CatalogueFilter
              categories={categories}
              catalogues={catalogues}
              category={category}
              catalogue={catalogue}
              onCategoryChange={setCategory}
              onCatalogueChange={setCatalogue}
              // Unfiltered on purpose: the options describe what the market
              // holds, not what the current filter has left of it.
              available={wholesaleProducts}
            />
          </div>

          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {copy.noResults}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {visible.map((product) => (
                <div key={product.id} className="flex flex-col">
                  <ProductCard product={product} />
                  {/* Deliberately neutral. The buyer is trading with the
                      store, and which shop supplied the goods is not theirs
                      to know — see lib/wholesale/orders.ts for the other half
                      of the same rule. */}
                  <p className="mt-1.5 truncate px-1 text-xs text-muted-foreground">
                    {copy.soldByStore}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
