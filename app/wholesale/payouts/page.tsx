import { notFound } from 'next/navigation'
import {
  SellerPayouts,
  type SellerPayoutRow,
} from '@/components/wholesale/seller-payouts'
import { getViewerPayoutShop } from '@/lib/wholesalers'
import { getSellerSettlements } from '@/lib/settlements'

export const dynamic = 'force-dynamic'

export default async function SellerPayoutsPage() {
  const shop = await getViewerPayoutShop()
  // The layout has already gated this; the check is here for the narrow window
  // where the shop is deleted between the two reads.
  if (!shop) notFound()

  const settlements = await getSellerSettlements(shop.id)

  // Mapped to plain values before crossing into the client component: Dates do
  // not serialise, and the seller has no business receiving the order-status
  // and discount columns that ride along on the row for the admin's benefit.
  const rows: SellerPayoutRow[] = settlements.map((row) => ({
    id: row.id,
    settlementNumber: row.settlementNumber,
    orderNumber: row.orderNumber,
    status: row.status,
    gross: row.grossAmount,
    commission: row.commissionAmount,
    payout: row.payoutAmount,
    commissionPct: row.commissionPct,
    pieces: row.pieceCount,
    settledAt: row.settledAt?.toISOString() ?? null,
  }))

  return <SellerPayouts rows={rows} suspended={shop.status === 'suspended'} />
}
