import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductLanding } from '@/components/product-landing'
import { SellerNoBuy } from '@/components/wholesale/seller-no-buy'
import { getViewerWholesaleRole } from '@/lib/wholesalers'
import { getProductDetail } from '@/lib/products'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'
import type { Locale } from '@/lib/i18n'
import type { Product } from '@/lib/types'

type LandingPageProps = { params: Promise<{ id: string }> }

/**
 * "15 Aug – 18 Aug", computed on the server.
 *
 * The same static 3–5 day promise the product page makes — there is no
 * shipping-zone data in the model — and formatted here rather than in the
 * client component so a `new Date()` on the client cannot disagree with the
 * server's around midnight.
 */
function deliveryWindow(locale: Locale): string {
  const format = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }

  return `${format(3)} – ${format(5)}`
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { id } = await params
  const [locale, { product }] = await Promise.all([
    getServerLocale(),
    getProductDetail(id),
  ])
  const t = getDictionary(locale)

  if (!product) {
    return { title: `${t.meta.productNotFound} ${t.meta.suffix}` }
  }

  return {
    title: `${product.name[locale]} ${t.meta.suffix}`,
    description: product.description?.[locale],
    openGraph: {
      title: `${product.name[locale]} ${t.meta.suffix}`,
      description: product.description?.[locale],
      images: [{ url: product.image }],
    },
  }
}

/**
 * Product structured data, so a link shared out of an ad or a chat resolves to
 * a price and a rating rather than a bare title. Built from the same row the
 * page renders, so the rich result cannot drift from the buy box.
 */
function productJsonLd(product: Product, images: string[], locale: Locale) {
  const moq = Math.max(1, product.moq ?? 1)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[locale],
    description: product.description?.[locale],
    image: images.length > 0 ? images : [product.image],
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: product.price,
      availability:
        product.stock >= moq
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    // Google drops the whole block when `aggregateRating` has a zero count, so
    // an unreviewed product carries no rating rather than an empty one.
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        }
      : null),
  }
}

// A distraction-free, single-product landing page for Facebook-ad traffic.
// The global header/footer are hidden on `/lp/*` (see ConditionalChrome), so
// this page is its own funnel: see the product, order on the spot.
export default async function LandingPage({ params }: LandingPageProps) {
  const { id } = await params

  // One batched round trip already carries the gallery and the approved
  // reviews, so the social-proof band below the fold costs no extra query.
  const [{ product, images, reviews }, locale, role] = await Promise.all([
    getProductDetail(id),
    getServerLocale(),
    getViewerWholesaleRole(),
  ])

  if (!product) notFound()

  // This page's whole point is the order form, and a wholesaler cannot use one
  // — `assertNotWholesaleSeller` would reject it at `createOrder`. Showing the
  // funnel and failing at the last step is the worst of both, so they get the
  // reason instead. Ad traffic is signed out, so this is the rare case.
  if (role === 'seller') return <SellerNoBuy />

  return (
    <>
      <script
        type="application/ld+json"
        // The payload is our own row, serialised by us — no user HTML reaches it.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product, images, locale)),
        }}
      />
      <ProductLanding
        product={product}
        images={images}
        reviews={reviews}
        deliveryWindow={deliveryWindow(locale)}
        year={new Date().getFullYear()}
      />
    </>
  )
}
