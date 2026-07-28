'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** The detail page hides its chrome behind Tailwind's `print:` variants. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Print invoice
    </Button>
  )
}
