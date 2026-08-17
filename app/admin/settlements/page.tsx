import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SettlementsTable,
  type AdminSettlementRow,
} from '@/components/admin/settlements/settlements-table'
import {
  getPayablesBySeller,
  getReconcileCount,
  getSettlementsPage,
  getSettlementStatusCounts,
  totalSettlements,
} from '@/lib/settlements'
import {
  SETTLEMENT_STATUSES,
  type SettlementStatus,
} from '@/lib/admin/settlement-status'
import { formatPrice } from '@/lib/currency'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; reconcile?: string }>
}) {
  const { status, q, reconcile } = await searchParams
  const active = SETTLEMENT_STATUSES.find((value) => value === status) as
    | SettlementStatus
    | undefined
  const reconciling = reconcile === '1'

  const [rows, counts, reconcileCount, payables] = await Promise.all([
    getSettlementsPage({
      status: active,
      search: q,
      reconcile: reconciling || undefined,
    }),
    getSettlementStatusCounts(),
    getReconcileCount(),
    getPayablesBySeller(),
  ])

  const totals = totalSettlements(rows)
  const dueTotal = payables.reduce((sum, row) => sum + row.due, 0)

  const settlements: AdminSettlementRow[] = rows.map((row) => ({
    id: row.id,
    settlementNumber: row.settlementNumber,
    orderNumber: row.orderNumber,
    shopName: row.shopNameSnapshot,
    status: row.status,
    gross: row.grossAmount,
    commission: row.commissionAmount,
    payout: row.payoutAmount,
    commissionPct: row.commissionPct,
    pieces: row.pieceCount,
    settledAt: row.settledAt?.toISOString() ?? null,
    needsReconciling: row.status === 'paid' && row.orderStatus !== 'delivered',
  }))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Settlements</h2>
          <p className="text-sm text-muted-foreground">
            What the store owes its sellers. A settlement is created when an
            order is placed and falls due when it is delivered.
          </p>
        </div>

        <form className="flex gap-2" action="/admin/settlements">
          {active && <input type="hidden" name="status" value={active} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Settlement, order or shop…"
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button type="submit" variant="outline" className="h-9">
            Search
          </Button>
          <Button asChild variant="outline" className="h-9">
            <Link href="/admin/settlements/statement">Build a statement</Link>
          </Button>
        </form>
      </div>

      {/* Money that has left the building on an order that is no longer
          delivered. Never reversed automatically — see settlementTransition in
          lib/orders.ts — so it has to be visible or it stays wrong for ever. */}
      {reconcileCount > 0 && (
        <Link
          href="/admin/settlements?reconcile=1"
          className="mb-4 block rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 hover:bg-rose-500/15"
        >
          <strong>{reconcileCount}</strong> paid settlement
          {reconcileCount === 1 ? '' : 's'} sit on an order that is not
          delivered. Reconcile {reconcileCount === 1 ? 'it' : 'them'} by hand.
        </Link>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tile
          label="Due to sellers"
          value={formatPrice(dueTotal)}
          hint={`${counts.due} settlement${counts.due === 1 ? '' : 's'} across ${payables.length} shop${payables.length === 1 ? '' : 's'}`}
        />
        <Tile
          label="Commission in view"
          value={formatPrice(totals.commission)}
          hint="The store's cut of the rows below"
        />
        <Tile
          label="Payout in view"
          value={formatPrice(totals.payout)}
          hint={`${totals.pieces} pieces across ${rows.length} settlement${rows.length === 1 ? '' : 's'}`}
        />
      </div>

      <nav className="mb-6 flex flex-wrap gap-1.5">
        {[undefined, ...SETTLEMENT_STATUSES].map((value) => {
          const href = value
            ? `/admin/settlements?status=${value}`
            : '/admin/settlements'
          return (
            <Link
              key={value ?? 'all'}
              href={href}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                !reconciling && active === value
                  ? 'border-transparent bg-button text-button-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {value ?? 'All'}
              <span className="ml-1.5 opacity-70">{counts[value ?? 'all']}</span>
            </Link>
          )
        })}
      </nav>

      <SettlementsTable rows={settlements} />
    </div>
  )
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
