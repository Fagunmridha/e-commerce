'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { BookingSheet } from '@/components/preorder/booking-sheet'
import { PreorderCard } from '@/components/preorder/preorder-card'
import type { Product } from '@/lib/types'

/**
 * Every pre-order product — where the homepage's Coming Soon "View All" leads.
 * The shop never lists these (they cannot share a cart with shelf stock), so
 * this is their only full listing.
 */
export function PreorderListing() {
  const { t } = useLanguage()
  const { preorderProducts } = useCatalogue()

  // The card the sheet was opened from; null while it is closed.
  const [selected, setSelected] = useState<Product | null>(null)

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-4">
      {preorderProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          {t.sections.noProductsForFilter}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {preorderProducts.map((product) => (
            <PreorderCard
              key={product.id}
              product={product}
              onBook={setSelected}
            />
          ))}
        </div>
      )}

      <BookingSheet
        product={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
