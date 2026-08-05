import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PreorderCheckoutContent } from '@/components/preorder/preorder-checkout-content'
import { getPreorderProductById } from '@/lib/products'
import { getShippingCost } from '@/lib/currency'
import { advancePct, splitPayment } from '@/lib/preorder'
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

  const subtotal = product.price * quantity
  const shipping = getShippingCost(subtotal)
  const total = subtotal + shipping
  const pct = advancePct(product)
  const { advance, due } = splitPayment(total, subtotal, pct)

  return (
    <PreorderCheckoutContent
      product={product}
      quantity={quantity}
      size={size}
      colorEn={colorEn}
      subtotal={subtotal}
      shipping={shipping}
      total={total}
      advancePct={pct}
      advance={advance}
      due={due}
      bkashNumber={BKASH_NUMBER}
      nagadNumber={NAGAD_NUMBER}
    />
  )
}
