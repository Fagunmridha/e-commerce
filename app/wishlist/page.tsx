import type { Metadata } from 'next'
import { WishlistContent } from '@/components/wishlist-content'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wishlist')
}

export default function WishlistPage() {
  return <WishlistContent />
}
