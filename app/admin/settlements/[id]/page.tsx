import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
import { MarkPaid } from '@/components/admin/settlements/mark-paid'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import { ADMIN_DOCUMENT_COPY } from '@/lib/admin/settlement-copy'
import { getSettlementById } from '@/lib/settlements'
import { buildSettlementView } from '@/lib/settlement-view'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export default async function AdminSettlementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const settlement = await getSettlementById(id)
  if (!settlement) notFound()

  // Admin-side English, so the document dates read the same as the rest of the
  // console rather than switching on whatever cookie the admin happens to hold.
  const view = buildSettlementView(settlement, (name) => name.en, 'en')

  // The whole order's discount comes out of the store's cut — the shop is paid
  // on its goods value regardless. Worth stating, because a coupon larger than
  // the commission means the store lost money on the trade.
  const storeNet = settlement.commissionAmount - settlement.orderDiscount

  return (
    <div>
      <SetBreadcrumbLabel label={settlement.settlementNumber} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/settlements">
            <ArrowLeft className="size-4" />
            All settlements
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/settlements/${id}/print`}>Open printable sheet</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-lg border border-border print:border-0">
          <SettlementDocument view={view} copy={ADMIN_DOCUMENT_COPY} />
        </div>

        <aside className="space-y-4 print:hidden">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Payment</h3>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              Recorded by hand — the store pays its sellers outside the app.
            </p>
            <MarkPaid
              id={settlement.id}
              status={settlement.status}
              payout={formatPrice(settlement.payoutAmount)}
            />
          </div>

          <div className="rounded-lg border border-border p-4 text-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              The store’s side
            </h3>
            <Row label="Commission" value={formatPrice(settlement.commissionAmount)} />
            <Row
              label="Order discount"
              value={`− ${formatPrice(settlement.orderDiscount)}`}
            />
            <Row label="Net to the store" value={formatPrice(storeNet)} strong />
            {storeNet < 0 && (
              <p className="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700">
                The coupon on this order was worth more than your commission, so
                the store is out of pocket on it. The shop’s payout is unaffected
                — a discount you chose to give does not reach back into what you
                owe them.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              The discount belongs to the whole order, so it is stated here in
              full even when another shop’s goods shared the basket.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 text-sm">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Order</h3>
            <Row label="Order" value={settlement.orderNumber} />
            <Row label="Order status" value={settlement.orderStatus} />
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link
                href={`/admin/orders?q=${encodeURIComponent(settlement.orderNumber)}`}
              >
                Find the order
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={
        strong
          ? 'mt-1 flex justify-between gap-3 border-t border-border pt-1 font-semibold text-foreground'
          : 'flex justify-between gap-3 text-muted-foreground'
      }
    >
      <span className="capitalize">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
