import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SellerSidebar } from '@/components/wholesale/seller-sidebar'
import { SellerHeader } from '@/components/wholesale/seller-header'
import { Redirecting } from '@/components/redirecting'
import { getViewerPayoutShop } from '@/lib/wholesalers'

/**
 * The payouts area — the seller console's chrome, its own gate.
 *
 * Deliberately outside the `(seller)` route group. That group's layout gates on
 * `approved`, and a suspended shop must still be able to see money the store
 * owes it for goods it already delivered — otherwise pausing a shop silently
 * hides its own accounts from it. Rather than widening that gate, which is the
 * same one keeping the marketplace closed, this segment carries a wider one of
 * its own and nothing writeable hangs off it.
 */
export const dynamic = 'force-dynamic'

export default async function SellerPayoutsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const shop = await getViewerPayoutShop()
  // Not `redirect()`: the shell has already streamed by the time this resolves,
  // the same reason /wholesale/apply uses this component.
  if (!shop) return <Redirecting to="/wholesale/apply" label="Taking you back…" />

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <SellerSidebar shopName={shop.shopName} />
        <SidebarInset className="min-w-0">
          <SellerHeader />
          <div className="flex flex-1 flex-col p-4 md:p-6 print:p-0">
            <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 print:max-w-none print:gap-0">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
