import { notFound, redirect } from 'next/navigation'
import { SellerProductForm } from '@/components/wholesale/seller-product-form'
import { getViewerShop } from '@/lib/wholesalers'
import { getSellerProductById } from '@/lib/products'
import { getServerDictionary } from '@/lib/server-locale'

export const dynamic = 'force-dynamic'

export default async function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shop = await getViewerShop()
  if (!shop) redirect('/wholesale/apply')

  // Scoped by shop, so another seller's id is a 404 rather than a form that
  // silently refuses to save.
  const [product, t] = await Promise.all([
    getSellerProductById(shop.id, id),
    getServerDictionary(),
  ])
  if (!product) notFound()

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <h1 className="mb-6 text-xl font-bold text-foreground">
        {t.wholesale.dashboard.editTitle} — {product.name.en}
      </h1>
      <SellerProductForm product={product} />
    </div>
  )
}
