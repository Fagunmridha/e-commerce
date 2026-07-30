import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { WholesalePitch } from '@/components/wholesale/wholesale-pitch'
import { getCurrentUser } from '@/lib/auth'
import { getApplicationForUser } from '@/lib/wholesalers'
import { pageMetadata } from '@/lib/metadata'

// Public on purpose — but it lists nothing. This is the pitch page carrying the
// Apply button, which has to be reachable before anyone is approved. The market
// itself is /wholesale/market, behind the approval gate in (seller)/layout.tsx.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesale')
}

export default async function WholesalePage() {
  // Signed out is the common case here, so this is a null check rather than a
  // redirect — the page just shows the plain "Apply" button.
  const user = await getCurrentUser()
  const application = user ? await getApplicationForUser(user.id) : undefined

  return (
    <>
      <PageHeader pageKey="wholesale" />
      <WholesalePitch status={application?.status ?? null} />
    </>
  )
}
