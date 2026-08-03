import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href="/wholesale/dashboard"
            aria-label={t.wholesale.nav.listings}
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
            {t.wholesale.dashboard.editTitle}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {product.name.en}
          </p>
        </div>
      </div>
      <SellerProductForm product={product} />
    </div>
  )
}
