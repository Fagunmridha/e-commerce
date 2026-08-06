import { redirect } from 'next/navigation'
import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { isAdmin } from '@/lib/auth'
import { getPendingApplicationCount } from '@/lib/wholesalers'
import { getPendingReviewCount } from '@/lib/reviews'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAdmin())) redirect('/')

  // The header's bell reflects real work waiting, not a decorative dot.
  const [[pending], pendingWholesalers, pendingReviews] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
    getPendingApplicationCount(),
    // Without this the moderation queue is invisible until someone happens to
    // open the page, which is how a review sits unpublished for a week.
    getPendingReviewCount(),
  ])

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="min-w-0">
          <AdminHeader
            pendingOrders={pending?.n ?? 0}
            pendingWholesalers={pendingWholesalers}
            pendingReviews={pendingReviews}
          />
          {/* The console is centred rather than pinned to the sidebar: on a wide
              monitor a full-bleed page leaves the content stranded in one
              corner with a river of empty space beside it. */}
          <div className="flex flex-1 flex-col p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
