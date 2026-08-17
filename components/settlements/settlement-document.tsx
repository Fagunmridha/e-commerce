import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/currency'

/**
 * The settlement sheet — the document both parties download.
 *
 * Purely presentational, and it takes its wording as a `copy` prop rather than
 * calling `useLanguage`. The admin console is English-only by convention and
 * the seller console is translated; passing the strings in is what lets one
 * component serve both without either side bending its rule.
 *
 * What is *not* on it matters as much as what is. No buyer name, phone,
 * address or city; no order total, coupon or delivery charge. An order total
 * would itself reveal how much of the basket belonged to another shop, which is
 * exactly the thing the marketplace keeps from both sides.
 */

export type SettlementDocumentCopy = {
  title: string
  lotTitle: string
  settlementNo: string
  orderNo: string
  issued: string
  delivered: string
  period: string
  fromParty: string
  toParty: string
  storeName: string
  colItem: string
  colQty: string
  colUnit: string
  colValue: string
  colRate: string
  colCommission: string
  colPayout: string
  colOrder: string
  colDelivered: string
  goodsValue: string
  commission: string
  payableToShop: string
  retainedByStore: string
  paidStamp: string
  unpaidStamp: string
  voidStamp: string
  pendingStamp: string
  paidOn: string
  reference: string
  settlementCount: string
  footerNote: string
}

/** One itemised row: a product line, or a whole settlement on a lot sheet. */
export type DocumentRow = {
  label: string
  /** Size / colour, or the delivery date on a lot sheet. */
  sub?: string
  quantity: number
  /** Absent on a lot row — a settlement has no single unit price. */
  unitPrice?: number
  value: number
  /** Null renders as the "mixed" dash: the rows behind it disagreed. */
  ratePct: number | null
  commission: number
  payout: number
}

export type SettlementDocumentView = {
  /** `single` itemises products; `lot` itemises settlements over a period. */
  variant: 'single' | 'lot'
  /** `CP-K3F91X-S1`, or the count line on a lot sheet. */
  reference: string
  orderNumber?: string
  issuedOn: string
  deliveredOn?: string
  periodFrom?: string
  periodTo?: string
  shopName: string
  rows: DocumentRow[]
  gross: number
  commission: number
  payout: number
  status: 'pending' | 'due' | 'paid' | 'void'
  paidOn?: string
  paidNote?: string | null
  /** Rows on a lot sheet, for the "{n} settlements" line. */
  count?: number
}

const STAMP_CLASS: Record<SettlementDocumentView['status'], string> = {
  pending: 'border-sky-600 text-sky-700',
  due: 'border-amber-600 text-amber-700',
  paid: 'border-emerald-600 text-emerald-700',
  void: 'border-muted-foreground text-muted-foreground',
}

export function SettlementDocument({
  view,
  copy,
  className,
}: {
  view: SettlementDocumentView
  copy: SettlementDocumentCopy
  className?: string
}) {
  const isLot = view.variant === 'lot'
  const stamp =
    view.status === 'paid'
      ? copy.paidStamp
      : view.status === 'void'
        ? copy.voidStamp
        : view.status === 'pending'
          ? copy.pendingStamp
          : copy.unpaidStamp

  return (
    <article
      className={cn(
        'mx-auto w-full max-w-3xl bg-background p-6 text-sm text-foreground sm:p-8 print:max-w-none print:p-0',
        className,
      )}
    >
      <header className="border-b-2 border-foreground pb-4">
        <h1 className="text-center text-lg font-bold tracking-wide uppercase">
          {isLot ? copy.lotTitle : copy.title}
        </h1>

        <dl className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field
            label={isLot ? copy.reference : copy.settlementNo}
            value={view.reference}
            mono
          />
          <Field label={copy.issued} value={view.issuedOn} />
          {view.orderNumber && (
            <Field label={copy.orderNo} value={view.orderNumber} mono />
          )}
          {view.deliveredOn && (
            <Field label={copy.delivered} value={view.deliveredOn} />
          )}
          {isLot && view.periodFrom && view.periodTo && (
            <Field
              label={copy.period}
              value={`${view.periodFrom} — ${view.periodTo}`}
            />
          )}
          {isLot && view.count !== undefined && (
            <Field
              label={copy.colOrder}
              value={copy.settlementCount.replace('{n}', String(view.count))}
            />
          )}
        </dl>
      </header>

      <div className="grid gap-4 border-b border-border py-4 sm:grid-cols-2">
        <Party label={copy.fromParty} name={copy.storeName} />
        <Party label={copy.toParty} name={view.shopName} />
      </div>

      {/* The only element allowed to scroll sideways; the page itself never
          does, and in print it lays out at full width regardless. */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="mt-4 w-full min-w-[36rem] text-left tabular-nums">
          <thead className="border-b border-foreground text-xs tracking-wide uppercase">
            <tr>
              <th className="py-2 pr-3 font-semibold">
                {isLot ? copy.colOrder : copy.colItem}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {copy.colQty}
              </th>
              {!isLot && (
                <th className="px-3 py-2 text-right font-semibold">
                  {copy.colUnit}
                </th>
              )}
              <th className="px-3 py-2 text-right font-semibold">
                {copy.colValue}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {copy.colRate}
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                {copy.colCommission}
              </th>
              <th className="py-2 pl-3 text-right font-semibold">
                {copy.colPayout}
              </th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row, index) => (
              <tr key={index} className="border-b border-border/60">
                <td className="py-2 pr-3">
                  <span className={cn(isLot && 'font-mono')}>{row.label}</span>
                  {row.sub && (
                    <span className="block text-xs text-muted-foreground">
                      {row.sub}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">{row.quantity}</td>
                {!isLot && (
                  <td className="px-3 py-2 text-right">
                    {row.unitPrice === undefined
                      ? '—'
                      : formatPrice(row.unitPrice)}
                  </td>
                )}
                <td className="px-3 py-2 text-right">{formatPrice(row.value)}</td>
                <td className="px-3 py-2 text-right">
                  {row.ratePct === null ? '—' : `${row.ratePct}%`}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatPrice(row.commission)}
                </td>
                <td className="py-2 pl-3 text-right font-medium">
                  {formatPrice(row.payout)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto w-full max-w-sm space-y-1.5">
        <Total label={copy.goodsValue} value={formatPrice(view.gross)} />
        <Total
          label={copy.commission}
          value={`− ${formatPrice(view.commission)}`}
        />
        <Total
          label={copy.payableToShop.replace('{shop}', view.shopName)}
          value={formatPrice(view.payout)}
          strong
        />
        <Total
          label={copy.retainedByStore}
          value={formatPrice(view.commission)}
        />
      </dl>

      <div className="mt-6 text-center">
        <span
          className={cn(
            'inline-block rounded border-2 px-6 py-1.5 text-sm font-bold tracking-widest uppercase',
            STAMP_CLASS[view.status],
          )}
        >
          {stamp}
        </span>
        {view.status === 'paid' && view.paidOn && (
          <p className="mt-2 text-xs text-muted-foreground">
            {copy.paidOn.replace('{date}', view.paidOn)}
            {view.paidNote && ` · ${view.paidNote}`}
          </p>
        )}
      </div>

      <p className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
        {copy.footerNote}
      </p>
    </article>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium', mono && 'font-mono')}>{value}</dd>
    </div>
  )
}

function Party({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-semibold">{name}</p>
    </div>
  )
}

function Total({
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
      className={cn(
        'flex items-baseline justify-between gap-4',
        strong && 'border-t border-foreground pt-1.5 text-base font-bold',
      )}
    >
      <dt className={cn(!strong && 'text-muted-foreground')}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
