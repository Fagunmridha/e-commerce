import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import { getSellerStatement, getSettlementShops } from '@/lib/settlements'
import { buildStatementView } from '@/lib/settlement-view'
import { statementRangeSchema } from '@/lib/validation/settlements'
import { ADMIN_DOCUMENT_COPY } from '@/lib/admin/settlement-copy'

export const dynamic = 'force-dynamic'

/**
 * The "lot" sheet: every settlement for one shop delivered inside a date range,
 * on one page.
 *
 * A plain GET form rather than an action, so the result is a URL — an admin can
 * bookmark last month's statement, and the print route is the same query with
 * `/print` on the end. The range is validated with the same schema the print
 * route uses, so a hand-edited URL cannot produce a sheet built from nonsense.
 */
export default async function AdminStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ seller?: string; from?: string; to?: string }>
}) {
  const { seller, from, to } = await searchParams
  const shops = await getSettlementShops()

  const parsed = statementRangeSchema.safeParse({
    sellerId: seller,
    from,
    to,
  })

  const shop = parsed.success
    ? shops.find((row) => row.id === parsed.data.sellerId)
    : undefined

  const rows =
    parsed.success && shop
      ? await getSellerStatement(
          parsed.data.sellerId,
          parsed.data.from,
          parsed.data.to,
        )
      : []

  const view =
    parsed.success && shop
      ? buildStatementView(
          rows,
          shop.shopName,
          parsed.data.from,
          parsed.data.to,
          'en',
        )
      : null

  return (
    <div>
      <div className="mb-4 print:hidden">
        <h2 className="text-xl font-bold text-foreground">
          Statement for a period
        </h2>
        <p className="text-sm text-muted-foreground">
          One sheet covering every settlement delivered to a shop between two
          dates. Cancelled settlements are left out — nothing is owed on them.
        </p>
      </div>

      <form
        action="/admin/settlements/statement"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4 print:hidden"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Shop</span>
          <select
            name="seller"
            defaultValue={seller ?? ''}
            required
            className="h-9 min-w-56 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Pick a shop…</option>
            {shops.map((row) => (
              <option key={row.id} value={row.id}>
                {row.shopName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">From</span>
          <Input
            type="date"
            name="from"
            defaultValue={from ?? ''}
            required
            className="h-9 w-40"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">To</span>
          <Input
            type="date"
            name="to"
            defaultValue={to ?? ''}
            required
            className="h-9 w-40"
          />
        </label>

        <Button type="submit" className="h-9">
          Build the sheet
        </Button>

        {view && (
          <Button asChild variant="outline" className="h-9">
            <Link
              href={`/admin/settlements/statement/print?seller=${seller}&from=${from}&to=${to}`}
            >
              Open printable sheet
            </Link>
          </Button>
        )}
      </form>

      {!parsed.success && (seller || from || to) && (
        <p className="mb-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          {parsed.error.issues[0]?.message ?? 'Pick a shop and a date range.'}
        </p>
      )}

      {view && rows.length === 0 && (
        <p className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Nothing was delivered to {shop?.shopName} in that period.
        </p>
      )}

      {view && rows.length > 0 && (
        <div className="rounded-lg border border-border print:border-0">
          <SettlementDocument view={view} copy={ADMIN_DOCUMENT_COPY} />
        </div>
      )}
    </div>
  )
}
