import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PreorderCheckoutContent } from '@/components/preorder/preorder-checkout-content'
import { SellerNoBuy } from '@/components/wholesale/seller-no-buy'
import { getViewerWholesaleRole } from '@/lib/wholesalers'
import { getPreorderProductById } from '@/lib/products'
import { advancePct } from '@/lib/preorder'
import { BKASH_NUMBER, NAGAD_NUMBER } from '@/lib/site-config'
import { getServerDictionary } from '@/lib/server-locale'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary()
  return { title: `${t.preorder.title} ${t.meta.suffix}` }
}

/**
 * The booking checkout.
 *
 * What is being booked travels in the query string rather than in the cart or
 * in session storage, which is what lets this be a server component: the price,
 * the ship date and the advance are all read from the database at render time,
 * so there is no hydration flash and nothing to re-fetch on the client. Refresh
 * and browser-back both work, and an ad can link straight here.
 *
 * None of it is trusted. `createOrder` re-reads the price, the MOQ, the
 * pre-order flag and the advance percentage from the product row, and the
 * atomic reservation is what actually gates quantity — a hand-edited `q=999`
 * fails there, not here.
 */
export default async function PreorderCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Ahead of the product lookup: a wholesaler books nothing either, and there
  // is no reason to price something they cannot have. `assertNotWholesaleSeller`
  // inside `createOrder` is the guard that actually holds; this is what tells
  // them why, since a server action's error text never reaches the client.
  if ((await getViewerWholesaleRole()) === 'seller') {
    return <SellerNoBuy />
  }

  const params = await searchParams
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value

  const id = first(params.p)
  if (!id) notFound()

  const product = await getPreorderProductById(id)
  // `getPreorderProductById` only ever returns pre-orders, so an id that is
  // shelf stock, deleted or a seller's listing lands here too.
  if (!product || product.stock <= 0) notFound()

  const minQuantity = product.moq ?? 1
  const requested = Number(first(params.q) ?? minQuantity)
  const quantity = Number.isFinite(requested)
    ? Math.min(Math.max(Math.floor(requested), minQuantity), product.stock)
    : minQuantity

  const size = first(params.size) || undefined
  const colorEn = first(params.color) || undefined

  // Only the goods value is priced here. Delivery — and therefore the total and
  // the advance split that hangs off it — depends on the zone the shopper
  // picks in the form, so the client component owns that arithmetic.
  const subtotal = product.price * quantity

  return (
    <PreorderCheckoutContent
      product={product}
      quantity={quantity}
      size={size}
      colorEn={colorEn}
      subtotal={subtotal}
      advancePct={advancePct(product)}
      bkashNumber={BKASH_NUMBER}
      nagadNumber={NAGAD_NUMBER}
    />
  )
}
