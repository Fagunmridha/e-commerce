import { redirect } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SellerSidebar } from '@/components/wholesale/seller-sidebar'
import { SellerHeader } from '@/components/wholesale/seller-header'
import { getViewerShop } from '@/lib/wholesalers'

/**
 * The seller panel's own chrome — the same sidebar shell /admin uses, so a shop
 * managing its stock gets a console rather than a page inside the storefront.
 * `ConditionalChrome` drops the site header and footer here for that reason.
 *
 * The route group's layout above has already gated approval; the shop is read
 * again here for the sidebar's name, and the redirect covers the narrow window
 * where approval is revoked between the two.
 */
export const dynamic = 'force-dynamic'

export default async function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const shop = await getViewerShop()
  if (!shop) redirect('/wholesale/apply')

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <SellerSidebar shopName={shop.shopName} />
        <SidebarInset className="min-w-0">
          <SellerHeader />
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
