import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/admin/orders/print-button'
import { SettlementDocument } from '@/components/settlements/settlement-document'
import { getSettlementById } from '@/lib/settlements'
import { buildSettlementView } from '@/lib/settlement-view'
import { ADMIN_DOCUMENT_COPY } from '@/lib/admin/settlement-copy'

export const dynamic = 'force-dynamic'

/**
 * The printable sheet, on its own route rather than behind a `?print=1` flag —
 * it is a document, so it deserves a permalink an admin can bookmark and hand
 * to someone.
 *
 * "Download PDF" is the browser's own print dialog: the console chrome is
 * hidden by `print:` variants (see app/admin/layout.tsx and the sidebar), and
 * going through the browser is what makes Bangla product names render, which no
 * PDF library would do without an embedded font.
 */
export default async function AdminSettlementPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const settlement = await getSettlementById(id)
  if (!settlement) notFound()

  const view = buildSettlementView(settlement, (name) => name.en, 'en')

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/settlements/${id}`}>
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
