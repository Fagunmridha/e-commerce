import { Redirecting } from '@/components/redirecting'
import { getViewerWholesaleRole } from '@/lib/wholesalers'
import { getServerDictionary } from '@/lib/server-locale'

/**
 * The buyer gate. The market used to sit inside the `(seller)` group and share
 * its approved-shop gate, back when a wholesaler both bought and sold here.
 * The two sides are exclusive now, so the market needs the opposite check to
 * the dashboard next door: buyers in, sellers out.
 *
 * `middleware.ts` has already established there is a session; what it cannot
 * check is which side that session joined, since that needs the database.
 *
 * A seller is sent to /wholesale, which routes them on to their own status or
 * shop — telling them to go somewhere they have no business being would only
 * be a dead end. Everyone else lands on the chooser, which is the page that
 * explains what they are missing.
 */
export const dynamic = 'force-dynamic'

export default async function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if ((await getViewerWholesaleRole()) !== 'buyer') {
    // `Redirecting` rather than `redirect()` for the same reason the seller
    // gate uses it: this resolves after the shell has streamed, and a bare
    // redirect shows an empty page until the next route starts loading.
    const t = await getServerDictionary()
    return <Redirecting to="/wholesale" label={t.common.loading} />
  }

  return <>{children}</>
}
