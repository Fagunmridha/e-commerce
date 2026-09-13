import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getAdminBadgeCounts } from '@/lib/admin/badges'
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

  // The header's bell reflects real work waiting, not a decorative dot: an
  // unmoderated review sits unpublished for a week and an unanswered message is
  // a customer waiting for a reply, and neither is visible until someone
  // happens to open the page.
  const badges = await getAdminBadgeCounts()

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="min-w-0">
          <AdminHeader {...badges} />
          {/* The console is centred rather than pinned to the sidebar: on a wide
              monitor a full-bleed page leaves the content stranded in one
              corner with a river of empty space beside it. */}
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
