import { Redirecting } from '@/components/redirecting'
import { getViewerShop } from '@/lib/wholesalers'
import { getServerDictionary } from '@/lib/server-locale'

/**
 * The approval gate for everything trade-only: the marketplace and the seller
 * dashboard.
 *
 * `middleware.ts` has already established there is a session. What it cannot
 * check is whether that user has an *approved* `wholesaler_applications` row,
 * which needs the database — same split as /admin, where the layout does the
 * role lookup. Server actions carry their own `requireApprovedWholesaler()`
 * guard, since an action is reachable without ever rendering this layout.
 *
 * Anyone who is not approved — signed out, never applied, pending, rejected or
 * suspended — goes to the apply page, which explains where they stand.
 */
export const dynamic = 'force-dynamic'

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await getViewerShop())) {
    // `Redirecting` rather than `redirect()` for the same reason the apply page
    // uses it: this gate resolves after the shell has streamed, so a bare
    // redirect shows an empty page until the apply route starts loading.
    const t = await getServerDictionary()
    return <Redirecting to="/wholesale/apply" label={t.common.loading} />
  }

  return <>{children}</>
}
