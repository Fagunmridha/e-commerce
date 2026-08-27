import { Redirecting } from '@/components/redirecting'
import { getViewerShop, getViewerWholesaleRole } from '@/lib/wholesalers'
import { getServerDictionary } from '@/lib/server-locale'

/**
 * The approval gate for the seller dashboard.
 *
 * `middleware.ts` has already established there is a session. What it cannot
 * check is whether that user has an *approved* `wholesaler_applications` row,
 * which needs the database — same split as /admin, where the layout does the
 * role lookup. Server actions carry their own `requireApprovedWholesaler()`
 * guard, since an action is reachable without ever rendering this layout.
 *
 * Where a rejected visitor is sent depends on which side they are on, and the
 * distinction matters: a seller waiting on approval wants the application, and
 * gets it; anyone else — a buyer, or someone who has not chosen — has no
 * business on that form and would only be bounced off it, so they go to
 * /wholesale and are routed from there.
 */
export const dynamic = 'force-dynamic'

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [shop, role] = await Promise.all([
    getViewerShop(),
    getViewerWholesaleRole(),
  ])

  if (!shop) {
    // `Redirecting` rather than `redirect()` for the same reason the apply page
    // uses it: this gate resolves after the shell has streamed, so a bare
    // redirect shows an empty page until the next route starts loading.
    const t = await getServerDictionary()
    return (
      <Redirecting
        to={role === 'seller' ? '/wholesale/apply' : '/wholesale'}
        label={t.common.loading}
      />
    )
  }

  return <>{children}</>
}
