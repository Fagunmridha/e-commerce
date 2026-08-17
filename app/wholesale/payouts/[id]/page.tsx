import { notFound } from 'next/navigation'
import { getViewerPayoutShop } from '@/lib/wholesalers'
import { getSellerSettlement } from '@/lib/settlements'
import { SellerSettlementSheet } from '@/components/wholesale/seller-settlement-sheet'

export const dynamic = 'force-dynamic'

export default async function SellerSettlementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shop = await getViewerPayoutShop()
  if (!shop) notFound()

  // The shop id is in the WHERE clause, not checked after the fact — a server
  // component is reachable by URL, so another shop's settlement must not load
  // and then be hidden. It simply does not resolve.
  const settlement = await getSellerSettlement(shop.id, id)
  if (!settlement) notFound()

  return (
    <SellerSettlementSheet
      settlement={{
        settlementNumber: settlement.settlementNumber,
        orderNumber: settlement.orderNumber,
        shopNameSnapshot: settlement.shopNameSnapshot,
        status: settlement.status,
        grossAmount: settlement.grossAmount,
        commissionAmount: settlement.commissionAmount,
        payoutAmount: settlement.payoutAmount,
        settledAt: settlement.settledAt?.toISOString() ?? null,
        createdAt: settlement.createdAt.toISOString(),
        paidAt: settlement.paidAt?.toISOString() ?? null,
        paidNote: settlement.paidNote,
        lines: settlement.lines,
      }}
    />
  )
}
