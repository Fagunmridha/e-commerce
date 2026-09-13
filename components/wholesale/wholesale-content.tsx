'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, ChevronRight, Clock, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { useLanguage } from '@/components/language-provider'
import { WholesaleForm } from '@/components/wholesale/wholesale-form'
import { TradeLinePicker } from '@/components/wholesale/trade-line-picker'
import type { WholesaleApplicationView } from '@/components/wholesale/types'
import type { Category } from '@/lib/types'

/**
 * The application screen: where an applicant stands, and the form.
 *
 * An approved shop never lands here (the page redirects them to their
 * dashboard), so the only statuses this has to render are pending, rejected and
 * suspended.
 */
export function WholesaleContent({
  application,
  defaultName,
  defaultEmail,
  lines,
}: {
  application: WholesaleApplicationView | null
  defaultName: string
  defaultEmail: string
  /** Every trade line open to trade, for the step before the form. */
  lines: Category[]
}) {
  const { t, pick } = useLanguage()
  const copy = t.wholesale
  const [editing, setEditing] = useState(false)

  /**
   * The trade line, chosen on a screen of its own before the form.
   *
   * It starts as whatever the applicant picked last time, so a resubmission
   * goes straight to the form rather than making them answer a question they
   * have already answered — and `pickingLine` is what the "Change" link flips
   * back on.
   */
  const [line, setLine] = useState(application?.categorySlug ?? '')
  const [pickingLine, setPickingLine] = useState(!application?.categorySlug)
  const lineName = lines.find((entry) => entry.slug === line)

  // Approved and suspended accounts have nothing to edit — the form is only
  // reachable while the application is new, queued or turned down.
  const canEdit =
    !application ||
    application.status === 'pending' ||
    application.status === 'rejected'
  const showForm = !application || editing || application.status === 'rejected'

  /**
   * One hero, and it says whichever step is actually on screen.
   *
   * The page used to stack three titles: the site's own `PageHeader` band, this
   * component's heading, and then the picker's. They were each correct on their
   * own and nonsense together — a reader scrolled past two headings to reach the
   * thing they had come to do. `PageHeader` is gone from the route and the
   * picker's heading moved here, so there is exactly one.
   */
  const hero =
    showForm && pickingLine
      ? { title: copy.linePicker.title, body: copy.linePicker.subtitle }
      : { title: copy.title, body: copy.subtitle }

  return (
    <>
      <section className="border-b border-border bg-muted/50">
        <Container className="py-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
            >
              <Link
                href="/wholesale"
                className="transition-colors hover:text-primary"
              >
                {t.pages.wholesale.breadcrumb}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="text-foreground">{copy.applyCta}</span>
            </nav>

            <p className="mt-4 text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {copy.badge}
            </p>
            <h1 className="mt-2 text-display-sm text-balance text-foreground">
              {hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-balance text-muted-foreground sm:text-base">
              {hero.body}
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        {application && (
          <StatusCard
            application={application}
            onEdit={canEdit && !showForm ? () => setEditing(true) : undefined}
          />
        )}

        {showForm &&
          (pickingLine ? (
            <TradeLinePicker
              lines={lines}
              value={line}
              onChange={setLine}
              onContinue={() => setPickingLine(false)}
            />
          ) : (
            <>
              {/* What they picked, and the way back to change it. The form below
                  never asks again — the line is settled by the time it renders,
                  which is the whole point of splitting the two screens. */}
              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  {copy.linePicker.chosen}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {lineName ? pick(lineName.name) : line}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setPickingLine(true)}
                >
                  {copy.linePicker.change}
                </Button>
              </div>

              <WholesaleForm
                application={application}
                defaultName={defaultName}
                defaultEmail={defaultEmail}
                categorySlug={line}
                onCancel={editing ? () => setEditing(false) : undefined}
              />
            </>
          ))}
      </Container>
    </>
  )
}

function StatusCard({
  application,
  onEdit,
}: {
  application: WholesaleApplicationView
  onEdit?: () => void
}) {
  const { t } = useLanguage()
  const copy = t.wholesale.status

  const config = {
    pending: {
      Icon: Clock,
      tone: 'bg-amber-500/12 text-amber-700',
      title: copy.pendingTitle,
      body: copy.pendingBody.replace('{phone}', application.phone),
    },
    approved: {
      Icon: BadgeCheck,
      tone: 'bg-emerald-500/12 text-emerald-700',
      title: copy.approvedTitle,
      body: copy.approvedBody,
    },
    rejected: {
      Icon: XCircle,
      tone: 'bg-rose-500/12 text-rose-700',
      title: copy.rejectedTitle,
      body: copy.rejectedBody,
    },
    suspended: {
      Icon: ShieldAlert,
      tone: 'bg-muted text-muted-foreground',
      title: copy.suspendedTitle,
      body: copy.suspendedBody,
    },
  }[application.status]

  const { Icon } = config

  return (
    <div className="mb-10 rounded-lg border border-border p-5">
      <div className="flex items-start gap-4">
        <span className={`rounded-md p-2 ${config.tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            {config.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{config.body}</p>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <div>
              <dt className="text-muted-foreground">{copy.shopLabel}</dt>
              <dd className="font-medium text-foreground">
                {application.shopName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {copy.submittedOn.replace('{date}', application.submittedOn)}
              </dt>
            </div>
          </dl>

          {application.reviewNote && (
            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-foreground">
                {copy.reasonLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {application.reviewNote}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {application.status === 'approved' && (
              <Button asChild size="sm">
                <Link href="/wholesale/dashboard">{copy.approvedCta}</Link>
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                {copy.edit}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
