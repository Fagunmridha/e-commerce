'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * The one print button in the codebase. The page hides its own chrome behind
 * Tailwind's `print:` variants, and the browser's print dialog is where "save
 * as PDF" lives — which is also why the settlement sheets need no PDF library
 * and render Bangla correctly: it is the browser's own text engine doing it.
 *
 * `label` defaults to the invoice wording the admin order page has always used.
 */
export function PrintButton({ label = 'Print invoice' }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      {label}
    </Button>
  )
}
