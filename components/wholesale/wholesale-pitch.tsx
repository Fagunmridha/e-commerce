'use client'

import Link from 'next/link'
import { BadgeCheck, Clock, Lock, Package, ShieldAlert, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { WholesalerStatus } from '@/lib/admin/wholesaler-status'

const BENEFIT_ICONS = [Package, BadgeCheck, Lock]

/**
 * The public face of the wholesale programme: what it is, and one button.
 *
 * Deliberately lists no products. The marketplace itself lives behind the
 * approval gate at /wholesale/market, so this page is what an ordinary shopper
 * — or a search engine — sees, and it must give nothing away.
 */
export function WholesalePitch({ status }: { status: WholesalerStatus | null }) {
  const { t } = useLanguage()
  const copy = t.wholesale

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <Badge variant="secondary" className="border-0">
        {copy.badge}
      </Badge>
      <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Cta status={status} />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {copy.benefits.map((benefit, index) => {
          const Icon = BENEFIT_ICONS[index] ?? Package
          return (
            <li key={benefit.title} className="rounded-lg border border-border p-4">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{benefit.body}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Where the button goes depends entirely on how far along the viewer is. */
function Cta({ status }: { status: WholesalerStatus | null }) {
  const { t } = useLanguage()
  const copy = t.wholesale.status

  if (status === 'approved') {
    return (
      <>
        <Button asChild size="lg">
          <Link href="/wholesale/market">{copy.marketCta}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/wholesale/dashboard">{copy.approvedCta}</Link>
        </Button>
      </>
    )
  }

  if (status === 'pending') {
    return <Notice Icon={Clock} text={copy.pendingTitle} />
  }

  if (status === 'suspended') {
    return <Notice Icon={ShieldAlert} text={copy.suspendedTitle} />
  }

  return (
    <>
      {status === 'rejected' && <Notice Icon={XCircle} text={copy.rejectedTitle} />}
      <Button asChild size="lg">
        <Link href="/wholesale/apply">
          {status === 'rejected' ? copy.edit : t.wholesale.applyCta}
        </Link>
      </Button>
    </>
  )
}

function Notice({
  Icon,
  text,
}: {
  Icon: typeof Clock
  text: string
}) {
  return (
    <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {text}
    </p>
  )
}
