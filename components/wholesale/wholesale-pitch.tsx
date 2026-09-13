'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  Lock,
  Package,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { WholesalerStatus } from '@/lib/admin/wholesaler-status'

const BENEFIT_ICONS = [Package, BadgeCheck, Lock]

/**
 * The seller's own front door: what the programme is, how it works, and one
 * button that changes with how far along they are.
 *
 * Built on the same three bands as the join screen next to it — a tinted hero
 * with the breadcrumb inside it, then full-width sections in a `Container`.
 * This used to be one left-aligned column in a page-width box under a separate
 * `PageHeader`, which read as two titles stacked over a thin list: the page had
 * a heading band, then a second heading, then three bordered boxes and a great
 * deal of nothing. The hero is now the only title on the page.
 *
 * Deliberately lists no products. The marketplace lives behind the approval
 * gate at /wholesale/market, so this is what an ordinary shopper — or a search
 * engine — sees, and it must give nothing away.
 */
export function WholesalePitch({ status }: { status: WholesalerStatus | null }) {
  const { t } = useLanguage()
  const copy = t.wholesale
  const pitch = copy.pitch

  // Only the states that have somewhere left to go get the closing band. An
  // approved shop's work is in its dashboard and a suspended one cannot act at
  // all, so repeating a button at them is noise.
  const showClosing = status === null || status === 'rejected'

  return (
    <>
      <section className="border-b border-border bg-muted/50">
        <Container className="py-10 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            {/* The page drops `PageHeader` on this branch, so the breadcrumb
                comes back here rather than as a second band above the hero. */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
            >
              <Link href="/" className="transition-colors hover:text-primary">
                {t.common.home}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="text-foreground">
                {t.pages.wholesale.breadcrumb}
              </span>
            </nav>

            <p className="mt-4 text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {copy.badge}
            </p>
            <h1 className="mt-2 text-display-sm text-balance text-foreground">
              {copy.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-balance text-muted-foreground sm:text-base">
              {copy.subtitle}
            </p>

            <div className="mt-7 flex flex-col items-center gap-3">
              <Cta status={status} />
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 sm:py-16">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {pitch.stepsEyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">
              {pitch.stepsTitle}
            </h2>
          </div>

          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {pitch.steps.map((step, index) => (
              <li key={step.title} className="relative">
                {/* The rule runs from this step's number to the next one's,
                    which is what makes four cards read as one sequence. Hidden
                    on the last, and at widths where they no longer sit in a
                    row for it to cross. */}
                {index < pitch.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-12 top-5 hidden h-px w-[calc(100%-2rem)] bg-border lg:block"
                  />
                )}
                <span className="relative grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t border-border bg-muted/40">
        <Container className="py-12 sm:py-16">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {pitch.benefitsEyebrow}
            </p>
          </div>

          <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {copy.benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index] ?? Package
              return (
                <li
                  key={benefit.title}
                  className="rounded-2xl border border-border bg-background p-6"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-primary/12 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {benefit.body}
                  </p>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {showClosing && (
        <section>
          <Container className="py-12 sm:py-16">
            <div className="rounded-2xl border border-primary/20 bg-accent/60 px-6 py-10 text-center sm:px-10">
              <h2 className="text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">
                {pitch.closingTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-balance text-muted-foreground">
                {pitch.closingBody}
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/wholesale/apply">
                  {status === 'rejected' ? copy.status.edit : copy.applyCta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}
    </>
  )
}

/** Where the button goes depends entirely on how far along the viewer is. */
function Cta({ status }: { status: WholesalerStatus | null }) {
  const { t } = useLanguage()
  const copy = t.wholesale.status

  if (status === 'approved') {
    // The shop only. A seller does not buy from the market they sell into, so
    // there is nowhere else for this button to go.
    return (
      <>
        <Notice Icon={BadgeCheck} tone="good" title={copy.approvedTitle} body={copy.approvedBody} />
        <Button asChild size="lg">
          <Link href="/wholesale/dashboard">
            {copy.approvedCta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </>
    )
  }

  if (status === 'pending') {
    return (
      <Notice
        Icon={Clock}
        tone="wait"
        title={copy.pendingTitle}
        // The phone number is the applicant's own, and the template reads
        // badly with the placeholder still in it if it ever arrives empty.
        body={copy.pendingBody.replace('{phone}', '')}
      />
    )
  }

  if (status === 'suspended') {
    return (
      <Notice
        Icon={ShieldAlert}
        tone="muted"
        title={copy.suspendedTitle}
        body={copy.suspendedBody}
      />
    )
  }

  return (
    <>
      {status === 'rejected' && (
        <Notice
          Icon={XCircle}
          tone="bad"
          title={copy.rejectedTitle}
          body={copy.rejectedBody}
        />
      )}
      <Button asChild size="lg">
        <Link href="/wholesale/apply">
          {status === 'rejected' ? copy.edit : t.wholesale.applyCta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </>
  )
}

const NOTICE_TONE = {
  good: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700',
  wait: 'border-amber-500/25 bg-amber-500/8 text-amber-700',
  bad: 'border-rose-500/25 bg-rose-500/8 text-rose-700',
  muted: 'border-border bg-muted text-muted-foreground',
} as const

/**
 * Where the applicant stands, as a card rather than the grey pill this used to
 * be — it is the most important thing on the page for anyone who has already
 * applied, and a one-line chip under a heading was not readable as that.
 */
function Notice({
  Icon,
  tone,
  title,
  body,
}: {
  Icon: typeof Clock
  tone: keyof typeof NOTICE_TONE
  title: string
  body: string
}) {
  return (
    <div
      className={cn(
        'flex w-full max-w-lg items-start gap-3 rounded-xl border px-4 py-3 text-left',
        NOTICE_TONE[tone],
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{body}</p>
      </div>
    </div>
  )
}
