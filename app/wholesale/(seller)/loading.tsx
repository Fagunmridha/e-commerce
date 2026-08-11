import { SellerConsoleSkeleton } from '@/components/wholesale/seller-console-skeleton'

/**
 * Catches the dashboard layout while it looks the shop up — a `loading.tsx`
 * only wraps its segment's *children*, so the boundary inside `dashboard/`
 * cannot cover `dashboard/layout.tsx` itself. Without this one, that wait falls
 * all the way back to /wholesale's storefront skeleton.
 */
export default function Loading() {
  return <SellerConsoleSkeleton />
}
