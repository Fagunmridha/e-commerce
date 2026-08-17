import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/admin/orders/print-button'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import { getSellerStatement, getSettlementShops } from '@/lib/settlements'
import { buildStatementView } from '@/lib/settlement-view'
import { statementRangeSchema } from '@/lib/validation/settlements'
import { ADMIN_DOCUMENT_COPY } from '@/lib/admin/settlement-copy'

export const dynamic = 'force-dynamic'

/** The lot sheet on its own route, so a period's statement has a permalink. */
export default async function AdminStatementPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ seller?: string; from?: string; to?: string }>
}) {
  const { seller, from, to } = await searchParams

  const parsed = statementRangeSchema.safeParse({ sellerId: seller, from, to })
  if (!parsed.success) notFound()

  const shops = await getSettlementShops()
  const shop = shops.find((row) => row.id === parsed.data.sellerId)
  if (!shop) notFound()

  const rows = await getSellerStatement(
    parsed.data.sellerId,
    parsed.data.from,
    parsed.data.to,
  )
  const view = buildStatementView(
    rows,
    shop.shopName,
    parsed.data.from,
    parsed.data.to,
    'en',
  )

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/admin/settlements/statement?seller=${seller}&from=${from}&to=${to}`}
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div className="w-44">
          <PrintButton label="Download PDF" />
        </div>
      </div>

      <SettlementDocument view={view} copy={ADMIN_DOCUMENT_COPY} />
    </div>
  )
}
