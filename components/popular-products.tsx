'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import type { CategorySlug } from '@/lib/types'

type Tab = CategorySlug | 'all'

export function PopularProducts() {
  const { t, pick } = useLanguage()
  const { products: allProducts, categories } = useCatalogue()
  const [tab, setTab] = useState<Tab>('all')

  const products = useMemo(() => {
    const list =
      tab === 'all'
        ? allProducts.filter((product) => product.badge)
        : allProducts.filter((product) => product.category === tab)

    return list.slice(0, 8)
  }, [tab, allProducts])

  const tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: t.home.tabAll },
    ...categories.map((category) => ({
      value: category.slug as Tab,
      label: pick(category.name),
    })),
  ]

  return (
    <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.home.popularEyebrow}
          title={t.home.popularTitle}
          linkLabel={t.sections.viewAll}
          linkHref="/shop"
        />
      </Reveal>

      <div
        role="tablist"
        aria-label={t.home.popularTitle}
        className="mb-8 flex flex-wrap gap-2"
      >
        {tabs.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={
              tab === item.value
                ? 'rounded-full bg-foreground px-5 py-2 text-xs font-bold tracking-wide text-background uppercase'
                : 'rounded-full border border-border px-5 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={product.id} delay={(index % 4) * 80}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
