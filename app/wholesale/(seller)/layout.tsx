import { redirect } from 'next/navigation'
import { getViewerShop } from '@/lib/wholesalers'

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
  if (!(await getViewerShop())) redirect('/wholesale/apply')

  return <>{children}</>
}
