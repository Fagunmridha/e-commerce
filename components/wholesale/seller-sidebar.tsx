'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ExternalLink, Store } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLanguage } from '@/components/language-provider'
import { SELLER_NAV, type SellerNavItem } from '@/lib/wholesale/nav'

/** True when `href` is the current page, or an ancestor of it. */
function isActive(pathname: string, href: string) {
  // The dashboard is every product page's parent, so it would light up on all
  // of them; it only counts as active on itself.
  if (href === '/wholesale/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavRow({
  item,
  pathname,
  label,
  notBuilt,
}: {
  item: SellerNavItem
  pathname: string
  label: string
  notBuilt: string
}) {
  const Icon = item.icon

  if (item.planned) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              disabled
              className="cursor-not-allowed opacity-45"
              tooltip={label}
            >
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">{notBuilt}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive(pathname, item.href)}
        tooltip={label}
      >
        <Link href={item.href}>
          <Icon />
          <span>{label}</span>
          {item.external && (
            <ExternalLink className="ml-auto size-3.5 opacity-60" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SellerSidebar({ shopName }: { shopName: string }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const nav = t.wholesale.nav

  return (
    // `print:hidden` so a settlement sheet prints as a document, not as a
    // screenshot of the console around it.
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/wholesale/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {shopName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {nav.panel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {SELLER_NAV.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{nav[group.labelKey]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    label={nav[item.labelKey]}
                    notBuilt={nav.notBuilt}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={nav.backToStore}>
              <Link href="/">
                <ArrowLeft />
                <span>{nav.backToStore}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
