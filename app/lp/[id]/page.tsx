import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductLanding } from '@/components/product-landing'
import { getProductDetail } from '@/lib/products'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'

type LandingPageProps = { params: Promise<{ id: string }> }

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

// A distraction-free, single-product landing page for Facebook-ad traffic.
// The global header/footer are hidden on `/lp/*` (see ConditionalChrome), so
// this page is its own funnel: see the product, order on the spot.
export default async function LandingPage({ params }: LandingPageProps) {
  const { id } = await params
  const { product, images } = await getProductDetail(id)

  if (!product) notFound()

  return <ProductLanding product={product} images={images} />
}
