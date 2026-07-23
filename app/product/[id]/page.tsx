import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product-detail'
import { RelatedProducts } from '@/components/related-products'
import { ProductReviews } from '@/components/product-reviews'
import {
  getProductById,
  getProductImages,
  getProductsByCategory,
} from '@/lib/products'
import { getProductReviews } from '@/lib/reviews'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'

type ProductPageProps = { params: Promise<{ id: string }> }

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

  const [images, categoryProducts, reviews] = await Promise.all([
    getProductImages(product),
    getProductsByCategory(product.category),
    getProductReviews(product.id),
  ])

  const related = categoryProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4)

  return (
    <>
      <ProductDetail product={product} images={images} />
      <ProductReviews productId={product.id} reviews={reviews} />
      <RelatedProducts products={related} viewAllHref={`/${product.category}`} />
    </>
  )
}
