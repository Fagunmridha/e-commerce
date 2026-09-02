'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { useLanguage } from '@/components/language-provider'

/**
 * What a wholesaler sees instead of a checkout form.
 *
 * The two sides of the programme are exclusive, and a seller orders nothing —
 * not trade stock, not house stock. `createOrder` is what makes that true; this
 * is what stops it being a mystery, because the alternative is a shopkeeper
 * filling in a delivery address and then being told "something went wrong" by a
 * toast that cannot explain itself (a server action's error text is redacted in
 * production, so the reason could never reach the client that way).
 *
 * The way out is `/wholesale` rather than the dashboard: an approved shop is
 * routed on from there, and a seller still waiting on approval — who has no
 * dashboard to go to — lands on their application status instead of bouncing
 * off a gate.
 */
export function SellerNoBuy() {
  const { t } = useLanguage()
  const copy = t.wholesale.join

  return (
    <>
      {/* `checkout` for the pre-order route too: a booking is a checkout, and
          the dictionary has no separate page title for one. */}
      <PageHeader pageKey="checkout" compact />
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <Store
          className="size-14 text-muted-foreground/40"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-foreground">{copy.sellerCannotBuyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.sellerCannotBuy}
          </p>
        </div>
        <Button asChild>
          <Link href="/wholesale">{copy.sellerHome}</Link>
        </Button>
      </section>
    </>
  )
}
