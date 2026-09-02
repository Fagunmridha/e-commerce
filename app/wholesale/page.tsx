import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { Redirecting } from '@/components/redirecting'
import { WholesaleJoin } from '@/components/wholesale/wholesale-join'
import { WholesalePitch } from '@/components/wholesale/wholesale-pitch'
import { getCurrentUser } from '@/lib/auth'
import { getApplicationForUser } from '@/lib/wholesalers'
import {
  getAllCatalogues,
  getAllCategories,
  getWholesaleProducts,
} from '@/lib/products'
import { pageMetadata } from '@/lib/metadata'
import { getServerDictionary } from '@/lib/server-locale'

/**
 * The wholesale front door, which is three different pages depending on who is
 * looking:
 *
 *  - nobody yet — the listings, locked, under the two join buttons;
 *  - a buyer — straight through to the market they already unlocked;
 *  - a seller — the pitch and their application status, which is the only
 *    thing left standing between them and a shop.
 *
 * Public on purpose, and it lists real stock rather than the old
 * gives-nothing-away pitch: trade price and minimum order are both on the
 * cards, so a shopkeeper can judge the market before committing to a side.
 * Ordering still needs a membership, which is what `WholesaleJoin` gates.
 */
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesale')
}

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>
}) {
  // Signed out is the common case here, so this is a null check rather than a
  // redirect — that visitor is exactly who the chooser is for.
  const [user, params] = await Promise.all([getCurrentUser(), searchParams])

  if (user?.wholesaleRole === 'buyer') {
    // `Redirecting` rather than `redirect()`, as everywhere else in this
    // section: the role resolves after the shell has streamed, and a bare
    // redirect would leave an empty page until /market starts loading.
    const t = await getServerDictionary()
    return <Redirecting to="/wholesale/market" label={t.common.loading} />
  }

  if (user?.wholesaleRole === 'seller') {
    const application = await getApplicationForUser(user.id)
    return (
      <>
        <PageHeader pageKey="wholesale" />
        <WholesalePitch status={application?.status ?? null} />
      </>
    )
  }

  const [products, categories, catalogues] = await Promise.all([
    getWholesaleProducts(),
    getAllCategories(),
    getAllCatalogues(),
  ])

  // No `PageHeader` on this branch: `WholesaleJoin` opens with its own hero,
  // and the band above it would only be a second title over the first.
  return (
    <WholesaleJoin
      products={products}
      categories={categories}
      catalogues={catalogues}
      signedIn={Boolean(user)}
      // Set when they picked a side, were sent to sign in, and have just come
      // back. Never trusted as a role — the component only replays the click,
      // and `chooseWholesaleRole` validates it like any other.
      resumeJoin={
        user && (params.join === 'buyer' || params.join === 'seller')
          ? params.join
          : undefined
      }
    />
  )
}
