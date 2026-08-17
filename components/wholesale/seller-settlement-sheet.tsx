'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import {
  buildSettlementView,
  type SettlementDocumentInput,
} from '@/lib/settlement-view'

/**
 * The seller's copy of a settlement sheet — the same component the admin
 * renders, handed `t.wholesale.document` instead of hardcoded English.
 *
 * A client component because the wording and the date formatting follow the
 * viewer's language cookie, which is a client concern here. The numbers are
 * not: every figure comes off the stored row, so the shop and the store are
 * looking at the same amounts in two languages.
 */
export function SellerSettlementSheet({
  settlement,
}: {
  settlement: SettlementDocumentInput
}) {
  const { t, pick, locale } = useLanguage()
  const copy = t.wholesale.document
  const view = buildSettlementView(settlement, pick, locale)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/wholesale/payouts">
            <ArrowLeft className="size-4" />
            {t.wholesale.payouts.backToPayouts}
          </Link>
        </Button>
        {/* The browser's print dialog is the download. Going through it is also
            what makes Bangla product names render, which is why the app carries
            no PDF library. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          {copy.download}
        </Button>
      </div>

      <div className="rounded-lg border border-border print:border-0">
        <SettlementDocument view={view} copy={copy} />
      </div>
    </div>
  )
}
