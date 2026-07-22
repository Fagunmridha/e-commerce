import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product-detail'
import { RelatedProducts } from '@/components/related-products'
import {
  PRODUCTS,
  getProductById,
  getProductImages,
  getProductsByCategory,
} from '@/lib/data'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'

type ProductPageProps = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }))
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const locale = await getServerLocale()
  const t = getDictionary(locale)
  const product = getProductById(id)

  if (!product) {
    return { title: `${t.meta.productNotFound} ${t.meta.suffix}` }
  }

  return {
    title: `${product.name[locale]} ${t.meta.suffix}`,
    description: product.description?.[locale],
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = getProductById(id)

  if (!product) notFound()

  const related = getProductsByCategory(product.category)
    .filter((item) => item.id !== product.id)
    .slice(0, 4)

  return (
    <>
      <ProductDetail product={product} images={getProductImages(product)} />
      <RelatedProducts products={related} viewAllHref={`/${product.category}`} />
    </>
  )
}
