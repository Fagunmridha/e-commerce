import { redirect } from 'next/navigation'
import { WishlistContent } from '@/components/wishlist-content'
import { getAccountContext } from '@/lib/account'

export default async function AccountWishlistPage() {
  // A seller cannot buy, so a wishlist has no use for them and the sidebar
  // does not offer it; this covers a typed-in address.
  const { wholesaleRole } = await getAccountContext()
  if (wholesaleRole === 'seller') redirect('/account')

  return <WishlistContent embedded />
}
