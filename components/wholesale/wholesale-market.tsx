'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { ProductCard } from '@/components/product-card'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'

export function WholesaleMarket() {
  const { t, pick } = useLanguage()
  const { wholesaleProducts, categories } = useCatalogue()
  const copy = t.wholesale.market

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return wholesaleProducts.filter(
      (product) =>
        (!category || product.category === category) &&
        // Product names only. The shop behind a listing is never shown to a
        // buyer, so searching by it would leak the very thing that is hidden.
        (!term || pick(product.name).toLowerCase().includes(term)),
    )
  }, [wholesaleProducts, search, category, pick])

  // Only offer categories that actually have listings behind them.
  const usable = categories.filter((item) =>
    wholesaleProducts.some((product) => product.category === item.slug),
  )

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
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
        <Button asChild size="sm">
          <Link href="/wholesale/dashboard">
            <Store className="size-4" aria-hidden="true" />
            {copy.sellCta}
          </Link>
        </Button>
      </div>

      {wholesaleProducts.length === 0 ? (
        <Empty className="rounded-lg border border-border">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <Button asChild size="sm" className="mt-2">
            <Link href="/wholesale/dashboard">{copy.sellCta}</Link>
          </Button>
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
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">{copy.allCategories}</option>
              {usable.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {pick(item.name)}
                </option>
              ))}
            </select>
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
