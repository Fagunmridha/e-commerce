'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Clock, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import { WholesaleForm } from '@/components/wholesale/wholesale-form'
import type { WholesaleApplicationView } from '@/components/wholesale/types'

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
}: {
  application: WholesaleApplicationView | null
  defaultName: string
  defaultEmail: string
}) {
  const { t } = useLanguage()
  const copy = t.wholesale
  const [editing, setEditing] = useState(false)

  // Approved and suspended accounts have nothing to edit — the form is only
  // reachable while the application is new, queued or turned down.
  const canEdit =
    !application ||
    application.status === 'pending' ||
    application.status === 'rejected'
  const showForm = !application || editing || application.status === 'rejected'

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      {application && (
        <StatusCard
          application={application}
          onEdit={canEdit && !showForm ? () => setEditing(true) : undefined}
        />
      )}

      {/* The benefits grid lives on /wholesale, which is where anyone arriving
          here has just come from — repeating it would only push the form down. */}
      {!application && (
        <div className="mb-10">
          <Badge variant="secondary" className="border-0">
            {copy.badge}
          </Badge>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
      )}

      {showForm && (
        <WholesaleForm
          application={application}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      )}
    </div>
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
      tone: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
      title: copy.pendingTitle,
      body: copy.pendingBody.replace('{phone}', application.phone),
    },
    approved: {
      Icon: BadgeCheck,
      tone: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
      title: copy.approvedTitle,
      body: copy.approvedBody,
    },
    rejected: {
      Icon: XCircle,
      tone: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
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
