import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ListingReview,
  type ListingReviewRow,
} from '@/components/admin/listing-review'
import { getPendingListings, getAllCatalogues } from '@/lib/products'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

const DATE = { day: 'numeric', month: 'short', year: 'numeric' } as const

export default async function ListingReviewPage() {
  const [listings, catalogues] = await Promise.all([
    getPendingListings(),
    // Every catalogue, not just the active ones: a listing filed under a
    // catalogue that has since been switched off still has to name it here, or
    // the reviewer reads a blank where a shelf should be.
    getAllCatalogues(),
  ])

  const rows: ListingReviewRow[] = listings.map((product) => ({
    id: product.id,
    // Seller names are stored as { en: name, bn: name } — identical by
    // construction, so `.en` needs no locale pick. The console is English-only.
    name: product.name.en,
    image: product.image,
    category: product.category,
    catalogue:
      catalogues.find((entry) => entry.slug === product.catalogue)?.name.en ??
      '',
    shopName: product.sellerName ?? 'Unknown shop',
    price: formatPrice(product.price),
    stock: product.stock,
    moq: product.moq ?? 1,
    submitted: product.submittedAt
      ? new Date(product.submittedAt).toLocaleDateString('en-GB', DATE)
      : '—',
  }))

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to products</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Listings to review
          </h2>
          <p className="text-sm text-muted-foreground">
            A seller&rsquo;s new listing goes live only once you approve it. A
            rejection is shown to them with your reason, and saving their
            correction puts it back in this queue.
          </p>
        </div>
      </div>

      <ListingReview rows={rows} />
    </div>
  )
}
