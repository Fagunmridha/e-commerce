import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product-detail'
import { RelatedProducts } from '@/components/related-products'
import { ProductReviews } from '@/components/product-reviews'
import { ProductFaq } from '@/components/product-faq'
import { ProductHelp } from '@/components/product-help'
import { FeatureBar } from '@/components/feature-bar'
import {
  getProductById,
  getProductImages,
  getProductsByCategory,
} from '@/lib/products'
import { getProductReviews } from '@/lib/reviews'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'
import type { Locale } from '@/lib/i18n'

type ProductPageProps = { params: Promise<{ id: string }> }

/**
 * "15 Aug – 18 Aug", computed on the server.
 *
 * A static 3–5 day window rather than real logistics — there is no shipping-zone
 * or lead-time data in the model, so this is a promise the copy makes, not a
 * calculation. Formatted here rather than in the client component because a
 * client-side `new Date()` would risk a hydration mismatch around midnight.
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
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const locale = await getServerLocale()
  const t = getDictionary(locale)
  const product = await getProductById(id)

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

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) notFound()

  const [images, categoryProducts, reviews, locale] = await Promise.all([
    getProductImages(product),
    getProductsByCategory(product.category),
    getProductReviews(product.id),
    getServerLocale(),
  ])

  const related = categoryProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4)

  // Reviews sit above the FAQ so the product's own content ranks ahead of the
  // store-wide boilerplate.
  return (
    <>
      <ProductDetail
        product={product}
        images={images}
        deliveryWindow={deliveryWindow(locale)}
      />
      <FeatureBar />
      <ProductReviews productId={product.id} reviews={reviews} />
      <ProductFaq />
      <ProductHelp />
      <RelatedProducts products={related} viewAllHref={`/${product.category}`} />
    </>
  )
}
