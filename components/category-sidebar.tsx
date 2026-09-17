'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Truck } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Catalogue, Category, CategorySlug, Product } from '@/lib/types'

/** In the order of `t.features` — picked for the three that fit a compact
 *  three-line list without a fourth that would crowd the sidebar. */
const TRUST_ICONS = [Truck, ShieldCheck, Sparkles]
const TRUST_INDEXES = [0, 2, 3] as const

/**
 * The category tree, a small promo card and the trust badges, stacked as one
 * rail beside a category page's grid.
 *
 * Every category is a collapsible section rather than a link straight to its
 * own page — the active one opens by default (`defaultValue`), and its own
 * catalogues become the same buttons the toolbar's dropdown already drives,
 * so picking one here or there lands on the identical state. A catalogue
 * under a *different* category is a plain link with `?catalogue=`, which
 * `CategoryPage` reads on mount — the only way to land pre-filtered on a page
 * that has not rendered yet.
 */
export function CategorySidebar({
  categories,
  catalogues,
  products,
  activeCategory,
  activeCatalogue,
  onCatalogueChange,
  className,
  showExtras = true,
}: {
  categories: Category[]
  catalogues: Catalogue[]
  /** Every shelf product store-wide, for the per-catalogue counts. */
  products: Product[]
  activeCategory: CategorySlug
  activeCatalogue: string
  /** Only ever fires for a catalogue under `activeCategory` — a plain link
   * handles every other one. */
  onCatalogueChange: (slug: string) => void
  className?: string
  /** Off inside the mobile filter sheet, where the promo card and trust
   * badges would just be dead weight below the category tree. */
  showExtras?: boolean
}) {
  const { t, pick } = useLanguage()
  const copy = t.category

  const countByCatalogue = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of products) {
      if (!product.catalogue) continue
      counts.set(product.catalogue, (counts.get(product.catalogue) ?? 0) + 1)
    }
    return counts
  }, [products])

  const activeCategoryRow = categories.find(
    (item) => item.slug === activeCategory,
  )

  return (
    <aside className={cn('w-full shrink-0 lg:w-64', className)}>
      <div className="space-y-5 lg:sticky lg:top-24">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 px-1 text-sm font-bold text-foreground">
            {copy.categoriesHeading}
          </h2>
          <Accordion
            type="single"
            collapsible
            defaultValue={activeCategory}
            className="w-full"
          >
            {categories.map((category) => {
              const lines = catalogues.filter(
                (item) => item.categorySlug === category.slug,
              )
              const isActiveCategory = category.slug === activeCategory

              return (
                <AccordionItem key={category.slug} value={category.slug}>
                  <AccordionTrigger
                    className={cn(
                      'py-2.5 text-sm font-semibold hover:no-underline',
                      isActiveCategory
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    {pick(category.name)}
                  </AccordionTrigger>
                  <AccordionContent>
                    {lines.length === 0 ? null : (
                      <ul className="space-y-0.5">
                        {lines.map((line) => {
                          const active =
                            isActiveCategory && line.slug === activeCatalogue
                          const count = countByCatalogue.get(line.slug) ?? 0

                          const rowClass = cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                            active
                              ? 'bg-primary/10 font-semibold text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )

                          return (
                            <li key={line.slug}>
                              {isActiveCategory ? (
                                <button
                                  type="button"
                                  onClick={() => onCatalogueChange(line.slug)}
                                  aria-pressed={active}
                                  className={rowClass}
                                >
                                  <span
                                    className={cn(
                                      'size-1.5 shrink-0 rounded-full',
                                      active ? 'bg-primary' : 'bg-transparent',
                                    )}
                                    aria-hidden="true"
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {pick(line.name)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {count}
                                  </span>
                                </button>
                              ) : (
                                <Link
                                  href={`/${category.slug}?catalogue=${line.slug}`}
                                  className={rowClass}
                                >
                                  <span
                                    className="size-1.5 shrink-0 rounded-full bg-transparent"
                                    aria-hidden="true"
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {pick(line.name)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {count}
                                  </span>
                                </Link>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        {showExtras && activeCategoryRow && (
          <Link
            href={`/${activeCategoryRow.slug}`}
            className="group relative block h-32 overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={activeCategoryRow.image}
              alt=""
              fill
              sizes="256px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-sm font-bold text-white">
                {pick(activeCategoryRow.name)}
              </p>
              <p className="text-xs text-white/80">
                {copy.sidebarPromoTagline}
              </p>
              <span className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-foreground">
                {copy.sidebarPromoCta}
              </span>
            </div>
          </Link>
        )}

        {showExtras && (
          <ul className="space-y-3 rounded-xl border border-border bg-card p-4">
            {TRUST_INDEXES.map((featureIndex, index) => {
              const feature = t.features[featureIndex]
              const Icon = TRUST_ICONS[index]
              if (!feature) return null

              return (
                <li key={feature.title} className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {feature.title}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
