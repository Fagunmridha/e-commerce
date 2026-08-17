'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarRange,
  Clock,
  Download,
  HandCoins,
  Percent,
  Search,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLanguage } from '@/components/language-provider'
import { downloadCsv, toCsv } from '@/lib/admin/export'
import { cn } from '@/lib/utils'
import type { SettlementStatus } from '@/lib/admin/settlement-status'

/** One settlement as the seller's own page renders it. */
export type SellerPayoutRow = {
  id: string
  settlementNumber: string
  orderNumber: string
  status: SettlementStatus
  gross: number
  commission: number
  payout: number
  commissionPct: number | null
  pieces: number
  /** ISO, or null while the order has not been delivered. */
  settledAt: string | null
}

const STATUSES: SettlementStatus[] = ['pending', 'due', 'paid', 'void']

/** The same palette the admin console uses, so one status reads the same twice. */
const STATUS_TONE: Record<SettlementStatus, string> = {
  pending: 'bg-sky-500/12 text-sky-700',
  due: 'bg-amber-500/12 text-amber-700',
  paid: 'bg-emerald-500/12 text-emerald-700',
  void: 'bg-muted text-muted-foreground',
}

export function SellerPayouts({
  rows,
  suspended,
}: {
  rows: SellerPayoutRow[]
  suspended: boolean
}) {
  const { t, locale, price } = useLanguage()
  const copy = t.wholesale.payouts

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const statusLabel: Record<SettlementStatus, string> = {
    pending: copy.statusPending,
    due: copy.statusDue,
    paid: copy.statusPaid,
    void: copy.statusVoid,
  }

  const day = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : copy.notDelivered

  // Cancelled settlements are listed but are not money anyone owes, so they are
  // out of every total — the same treatment cancelled orders get next door.
  const live = rows.filter((row) => row.status !== 'void')
  const sum = (
    predicate: (row: SellerPayoutRow) => boolean,
    field: 'payout' | 'commission' = 'payout',
  ) =>
    live
      .filter(predicate)
      .reduce((total, row) => total + row[field], 0)

  const upcoming = sum((row) => row.status === 'pending')
  const due = sum((row) => row.status === 'due')
  const paid = sum((row) => row.status === 'paid')
  const commission = sum(() => true, 'commission')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter(
      (row) =>
        (!status || row.status === status) &&
        (!term ||
          row.orderNumber.toLowerCase().includes(term) ||
          row.settlementNumber.toLowerCase().includes(term)),
    )
  }, [rows, search, status])

  // Headers are the seller's own language, but the *keys* and the numbers are
  // raw — this file goes into a spreadsheet, so a formatted "৳1,200" would land
  // as text that will not add up.
  const exportCsv = () =>
    downloadCsv(
      'payouts',
      toCsv(
        visible.map((row) => ({
          settlement: row.settlementNumber,
          order: row.orderNumber,
          delivered: row.settledAt?.slice(0, 10) ?? '',
          pieces: row.pieces,
          gross: row.gross,
          rate: row.commissionPct ?? '',
          commission: row.commission,
          payout: row.payout,
          status: statusLabel[row.status],
        })),
        [
          { key: 'settlement', label: copy.colSettlement },
          { key: 'order', label: copy.colOrder },
          { key: 'delivered', label: copy.colDelivered },
          { key: 'pieces', label: copy.colPieces },
          { key: 'gross', label: copy.colValue },
          { key: 'rate', label: '%' },
          { key: 'commission', label: copy.colCommission },
          { key: 'payout', label: copy.colPayout },
          { key: 'status', label: copy.colStatus },
        ],
      ),
    )

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/wholesale/payouts/statement">
            <CalendarRange className="size-4" />
            {copy.statementTitle}
          </Link>
        </Button>
      </div>

      {suspended && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          {copy.suspendedNotice}
        </p>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={copy.statUpcoming}
            value={price(upcoming)}
            hint={copy.statUpcomingHint}
            icon={Clock}
            tone="sky"
          />
          <StatTile
            label={copy.statDue}
            value={price(due)}
            hint={copy.statDueHint}
            icon={HandCoins}
            tone={due > 0 ? 'amber' : 'emerald'}
          />
          <StatTile
            label={copy.statPaid}
            value={price(paid)}
            icon={Wallet}
            tone="emerald"
          />
          <StatTile
            label={copy.statCommission}
            value={price(commission)}
            hint={copy.statCommissionHint}
            icon={Percent}
            tone="violet"
          />
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {copy.title}
            {rows.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({visible.length})
              </span>
            )}
          </h2>

          {rows.length > 0 && (
            <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
              <div className="relative min-w-48 flex-1 sm:max-w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-9 pl-9"
                  aria-label={copy.searchPlaceholder}
                />
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label={copy.allStatuses}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">{copy.allStatuses}</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel[value]}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={exportCsv}
              >
                <Download className="size-4" />
                {copy.downloadCsv}
              </Button>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandCoins className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted-foreground">{copy.noResults}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setStatus('')
              }}
            >
              {copy.clearFilters}
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      {copy.colSettlement}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {copy.colDelivered}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colPieces}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colValue}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colCommission}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colPayout}
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      {copy.colStatus}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-border transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/wholesale/payouts/${row.id}`}
                          className="font-mono font-medium text-foreground hover:underline"
                        >
                          {row.settlementNumber}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {row.orderNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {day(row.settledAt)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {row.pieces}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {price(row.gross)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {price(row.commission)}
                        <span className="ml-1 text-xs">
                          {row.commissionPct === null
                            ? `(${copy.mixedRate})`
                            : `(${row.commissionPct}%)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                        {price(row.payout)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={cn('border-0', STATUS_TONE[row.status])}
                        >
                          {statusLabel[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards, so nothing scrolls sideways. */}
            <ul className="divide-y divide-border md:hidden">
              {visible.map((row) => (
                <li key={row.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/wholesale/payouts/${row.id}`}
                        className="font-mono font-medium text-foreground"
                      >
                        {row.settlementNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {day(row.settledAt)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('border-0', STATUS_TONE[row.status])}
                    >
                      {statusLabel[row.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {copy.colValue} {price(row.gross)} · {copy.colCommission}{' '}
                      {price(row.commission)}
                    </p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {price(row.payout)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  )
}

const TILE_TONE = {
  violet: 'bg-violet-500/12 text-violet-600',
  sky: 'bg-sky-500/12 text-sky-600',
  emerald: 'bg-emerald-500/12 text-emerald-600',
  amber: 'bg-amber-500/12 text-amber-600',
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Wallet
  tone: keyof typeof TILE_TONE
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            TILE_TONE[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}
