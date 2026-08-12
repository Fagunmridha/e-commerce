import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { Redirecting } from '@/components/redirecting'
import { WholesaleContent } from '@/components/wholesale/wholesale-content'
import type { WholesaleApplicationView } from '@/components/wholesale/types'
import { getCurrentUser } from '@/lib/auth'
import { getApplicationForUser } from '@/lib/wholesalers'
import { pageMetadata } from '@/lib/metadata'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesale')
}

export default async function WholesaleApplyPage() {
  // `middleware.ts` already gates /wholesale/apply, so this only catches the
  // gap between a Clerk session and its users row.
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [row, locale] = await Promise.all([
    getApplicationForUser(user.id),
    getServerLocale(),
  ])

  // An approved shop has nothing left to apply for; their work is in the
  // dashboard. Details are changed by an admin, not by resubmitting.
  //
  // Not `redirect()`: by the time this row is back the shell has been streamed,
  // so that would resolve the page to nothing and leave the header sitting on
  // the footer until the dashboard request starts. `Redirecting` keeps a
  // spinner on screen for that window instead — see its own note.
  if (row?.status === 'approved') {
    return (
      <Redirecting
        to="/wholesale/dashboard"
        label={getDictionary(locale).wholesale.status.openingDashboard}
      />
    )
  }

  const application: WholesaleApplicationView | null = row
    ? {
        status: row.status,
        shopName: row.shopName,
        businessType: row.businessType,
        taxToken: row.taxToken,
        binNumber: row.binNumber,
        tradeLicenseNo: row.tradeLicenseNo,
        yearsInBusiness: row.yearsInBusiness,
        contactName: row.contactName,
        phone: row.phone,
        altPhone: row.altPhone,
        email: row.email,
        website: row.website,
        address: row.address,
        city: row.city,
        district: row.district,
        postcode: row.postcode,
        tradeLicenseImage: row.tradeLicenseImage,
        shopPhoto: row.shopPhoto,
        ownerPhoto: row.ownerPhoto,
        note: row.note,
        reviewNote: row.reviewNote,
        submittedOn: row.createdAt.toLocaleDateString(
          locale === 'bn' ? 'bn-BD' : 'en-GB',
          { day: 'numeric', month: 'short', year: 'numeric' },
        ),
      }
    : null

  return (
    <>
      <PageHeader pageKey="wholesale" />
      <WholesaleContent
        application={application}
        defaultName={user.name ?? ''}
        defaultEmail={user.email}
      />
    </>
  )
}
