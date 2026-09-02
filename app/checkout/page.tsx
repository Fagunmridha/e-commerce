import type { Metadata } from 'next'
import { CheckoutContent } from '@/components/checkout-content'
import { SellerNoBuy } from '@/components/wholesale/seller-no-buy'
import { getViewerWholesaleRole } from '@/lib/wholesalers'
import { pageMetadata } from '@/lib/metadata'

// The seller check needs the request's user, so this can no longer be static.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('checkout')
}

export default async function CheckoutPage() {
  // A wholesaler orders nothing — see `assertNotWholesaleSeller`, which is the
  // guard that actually holds. This only spares them the form: without it they
  // would fill in a delivery address and get a toast that cannot say why.
  if ((await getViewerWholesaleRole()) === 'seller') {
    return <SellerNoBuy />
  }

  return <CheckoutContent />
}
