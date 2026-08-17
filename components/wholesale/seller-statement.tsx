'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/components/language-provider'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import {
  buildStatementView,
  type StatementRowInput,
} from '@/lib/settlement-view'

/**
 * The seller's period statement. A plain GET form, so the built sheet is a URL
 * the shop can bookmark or send to its own accountant — the same shape as the
 * admin's version, minus the shop picker, which the session decides.
 */
export function SellerStatement({
  shopName,
  from,
  to,
  valid,
  touched,
  rows,
}: {
  shopName: string
  from: string
  to: string
  /** The range parsed. False with `touched` means the dates were unusable. */
  valid: boolean
  /** Whether the visitor has submitted anything yet. */
  touched: boolean
  rows: StatementRowInput[]
}) {
  const { t, locale } = useLanguage()
  const copy = t.wholesale.payouts
  const view = valid
    ? buildStatementView(rows, shopName, from, to, locale)
    : null

  return (
    <div>
      <div className="mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/wholesale/payouts">
            <ArrowLeft className="size-4" />
            {copy.backToPayouts}
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {copy.statementTitle}
        </h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
          {copy.statementBody}
        </p>
      </div>

      <form
        action="/wholesale/payouts/statement"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4 print:hidden"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">{copy.from}</span>
          <Input
            type="date"
            name="from"
            defaultValue={from}
            required
            className="h-9 w-40"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">{copy.to}</span>
          <Input
            type="date"
            name="to"
            defaultValue={to}
            required
            className="h-9 w-40"
          />
        </label>
        <Button type="submit" className="h-9">
          {copy.generate}
        </Button>
        {view && rows.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            {t.wholesale.document.download}
          </Button>
        )}
      </form>

      {touched && !valid && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          {copy.noResults}
        </p>
      )}

      {view && rows.length === 0 && (
        <p className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
          {copy.noResults}
        </p>
      )}

      {view && rows.length > 0 && (
        <div className="rounded-lg border border-border print:border-0">
          <SettlementDocument view={view} copy={t.wholesale.document} />
        </div>
      )}
    </div>
  )
}
