'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLanguage } from '@/components/language-provider'
import { deleteSellerProduct } from '@/app/actions/seller-products'
import type { Product } from '@/lib/types'

/**
 * An approved shop's own listings.
 *
 * Only approved shops get here — the route group's layout redirects everyone
 * else — so there is no paused or pending state to render.
 */
export function SellerDashboard({
  shopName,
  products,
}: {
  shopName: string
  products: Product[]
}) {
  const { t, pick, price } = useLanguage()
  const router = useRouter()
  const copy = t.wholesale.dashboard
  const [removing, setRemoving] = useState<string | null>(null)

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)

  async function onRemove(id: string) {
    if (!window.confirm(copy.removeConfirm)) return

    setRemoving(id)
    const result = await deleteSellerProduct(id)
    setRemoving(null)

    if (!result.ok) {
      toast.error(copy.failed, { description: result.error })
      return
    }

    toast.success(copy.removed)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-primary/10 p-2 text-primary">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{shopName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.totalProducts}: {products.length} · {copy.totalStock}:{' '}
              {totalStock}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/wholesale/market">{copy.marketCta}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/wholesale/dashboard/products/new">
              <Plus className="size-4" aria-hidden="true" />
              {copy.addProduct}
            </Link>
          </Button>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {copy.myProducts}
      </h3>

      {products.length === 0 ? (
        <Empty className="rounded-lg border border-border">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <Button asChild size="sm" className="mt-2">
            <Link href="/wholesale/dashboard/products/new">
              {copy.addProduct}
            </Link>
          </Button>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{copy.colProduct}</th>
                <th className="px-4 py-3 font-medium">{copy.colCategory}</th>
                <th className="px-4 py-3 font-medium">{copy.colPrice}</th>
                <th className="px-4 py-3 font-medium">{copy.colStock}</th>
                <th className="px-4 py-3 font-medium">{copy.colMoq}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {copy.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={product.image}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                      <span className="font-medium text-foreground">
                        {pick(product.name)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {price(product.price)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.stock}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.moq ?? 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/wholesale/dashboard/products/${product.id}`}
                        >
                          {copy.edit}
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removing === product.id}
                        onClick={() => onRemove(product.id)}
                      >
                        {copy.remove}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
