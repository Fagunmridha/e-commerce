import { notFound } from 'next/navigation'
import { getViewerPayoutShop } from '@/lib/wholesalers'
import { getSellerStatement } from '@/lib/settlements'
import { statementRangeSchema } from '@/lib/validation/settlements'
import { SellerStatement } from '@/components/wholesale/seller-statement'

export const dynamic = 'force-dynamic'

/**
 * The seller's own "lot" sheet — every settlement delivered to them between two
 * dates.
 *
 * The shop comes from the session, never from the query string: the admin's
 * version of this page picks a shop, and this one deliberately cannot. Only the
 * dates are read from the URL, so a bookmarked range stays a bookmark.
 */
export default async function SellerStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const shop = await getViewerPayoutShop()
  if (!shop) notFound()

  const parsed = statementRangeSchema.safeParse({
    sellerId: shop.id,
    from,
    to,
  })

  const rows = parsed.success
    ? await getSellerStatement(shop.id, parsed.data.from, parsed.data.to)
    : []

  return (
    <SellerStatement
      shopName={shop.shopName}
      from={parsed.success ? parsed.data.from : (from ?? '')}
      to={parsed.success ? parsed.data.to : (to ?? '')}
      valid={parsed.success}
      touched={Boolean(from || to)}
      rows={rows.map((row) => ({
        orderNumber: row.orderNumber,
        status: row.status,
        grossAmount: row.grossAmount,
        commissionAmount: row.commissionAmount,
        payoutAmount: row.payoutAmount,
        commissionPct: row.commissionPct,
        pieceCount: row.pieceCount,
        settledAt: row.settledAt?.toISOString() ?? null,
      }))}
    />
  )
}
