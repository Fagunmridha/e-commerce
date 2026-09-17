'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  ShieldAlert,
  Store,
  XCircle,
} from 'lucide-react'
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
   * The trade lines, ticked on a screen of their own before the form.
   *
   * They start as whatever the applicant asked for last time, so a resubmission
   * goes straight to the form rather than making them answer a question they
   * have already answered — and `pickingLine` is what the "Change" link flips
   * back on.
   */
  const [picked, setPicked] = useState<string[]>(
    application?.categorySlugs ?? [],
  )
  const [pickingLine, setPickingLine] = useState(
    !application?.categorySlugs.length,
  )
  const pickedNames = lines
    .filter((entry) => picked.includes(entry.slug))
    .map((entry) => pick(entry.name))

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
              value={picked}
              onChange={setPicked}
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
                  {pickedNames.join(', ')}
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
                categorySlugs={picked}
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
      tone: 'bg-amber-500/12 text-amber-700 ring-amber-500/20',
      bar: 'bg-amber-500',
      badge: 'bg-amber-500/12 text-amber-700',
      badgeLabel: copy.pendingBadge,
      title: copy.pendingTitle,
      body: copy.pendingBody.replace('{phone}', application.phone),
    },
    approved: {
      Icon: BadgeCheck,
      tone: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-500/12 text-emerald-700',
      badgeLabel: copy.approvedBadge,
      title: copy.approvedTitle,
      body: copy.approvedBody,
    },
    rejected: {
      Icon: XCircle,
      tone: 'bg-rose-500/12 text-rose-700 ring-rose-500/20',
      bar: 'bg-rose-500',
      badge: 'bg-rose-500/12 text-rose-700',
      badgeLabel: copy.rejectedBadge,
      title: copy.rejectedTitle,
      body: copy.rejectedBody,
    },
    suspended: {
      Icon: ShieldAlert,
      tone: 'bg-muted text-muted-foreground ring-border',
      bar: 'bg-muted-foreground/40',
      badge: 'bg-muted text-muted-foreground',
      badgeLabel: copy.suspendedBadge,
      title: copy.suspendedTitle,
      body: copy.suspendedBody,
    },
  }[application.status]

  const { Icon } = config

  // A quick sense of where the application stands in the review — only
  // meaningful while it's actually being decided, so pending is the one
  // status that earns the extra chrome.
  const steps =
    application.status === 'pending'
      ? [
          { label: copy.stepSubmitted, state: 'done' as const },
          { label: copy.stepReviewing, state: 'current' as const },
          { label: copy.stepDecision, state: 'upcoming' as const },
        ]
      : null

  return (
    <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={`h-1 ${config.bar}`} aria-hidden="true" />

      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ${config.tone}`}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold text-foreground">
                {config.title}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${config.badge}`}
              >
                {config.badgeLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {config.body}
            </p>

            {steps && (
              <ol className="mt-6 flex items-start gap-2 sm:max-w-md">
                {steps.map((step, index) => (
                  <li
                    key={step.label}
                    className="flex flex-1 items-center gap-2 last:flex-initial"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={
                          'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ' +
                          (step.state === 'done'
                            ? 'bg-primary text-primary-foreground'
                            : step.state === 'current'
                              ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                              : 'bg-muted text-muted-foreground')
                        }
                      >
                        {step.state === 'done' ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={
                          'text-center text-[11px] leading-tight whitespace-nowrap ' +
                          (step.state === 'upcoming'
                            ? 'text-muted-foreground'
                            : 'font-medium text-foreground')
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <span
                        className={
                          'mb-4.5 h-px flex-1 ' +
                          (step.state === 'done' ? 'bg-primary' : 'bg-border')
                        }
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <Store
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="text-xs">
                  <p className="text-muted-foreground">{copy.shopLabel}</p>
                  <p className="font-medium text-foreground">
                    {application.shopName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <Calendar
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium text-foreground">
                  {copy.submittedOn.replace('{date}', application.submittedOn)}
                </p>
              </div>
            </div>

            {application.reviewNote && (
              <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <p className="text-xs font-medium text-rose-700">
                  {copy.reasonLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {application.reviewNote}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
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
    </div>
  )
}
