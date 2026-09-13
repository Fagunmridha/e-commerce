'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Layers, Store } from 'lucide-react'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { categoriesInLine } from '@/lib/category-tree'
import { SELLER_NAV, type SellerNavItem } from '@/lib/wholesale/nav'
import type { CategorySlug } from '@/lib/types'

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

/**
 * The shop's own slice of the catalogue tree: the lines it was approved for,
 * the categories under each, and the catalogues under those.
 *
 * Built here rather than listed in `lib/wholesale/nav.ts` beside the static
 * rows, because it is not navigation in the same sense — it is *this* shop's
 * permissions drawn as a tree, and no two shops see the same one. A seller
 * approved for Clothing must not be shown Electronics at all, which is why the
 * whole thing starts from `sellerLines` rather than from the full catalogue.
 *
 * Every row links into the dashboard's own filters, so clicking a catalogue
 * narrows the listing table to it. That is what keeps this from being a
 * decorative outline of a tree the seller cannot act on.
 */
function CatalogueNav({ sellerLines }: { sellerLines: CategorySlug[] }) {
  const { t, pick } = useLanguage()
  const { wholesaleCategories, catalogues } = useCatalogue()
  const params = useSearchParams()
  const activeCategory = params.get('category') ?? ''
  const activeCatalogue = params.get('catalogue') ?? ''

  const tree = useMemo(
    () =>
      sellerLines.map((slug) => {
        const line = wholesaleCategories.find(
          (category) => category.slug === slug,
        )
        return {
          slug,
          label: line ? pick(line.name) : slug,
          categories: categoriesInLine(wholesaleCategories, slug).map(
            (category) => ({
              slug: category.slug,
              label: pick(category.name),
              catalogues: catalogues
                .filter((entry) => entry.categorySlug === category.slug)
                .map((entry) => ({
                  slug: entry.slug,
                  label: pick(entry.name),
                })),
            }),
          ),
        }
      }),
    [sellerLines, wholesaleCategories, catalogues, pick],
  )

  // A shop approved before trade lines existed has none, and drawing an empty
  // "Catalogue" heading over nothing reads as a section that failed to load.
  if (tree.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t.wholesale.nav.groupCatalogue}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {tree.map((line) => (
            <SidebarMenuItem key={line.slug}>
              <SidebarMenuButton
                asChild
                tooltip={line.label}
                isActive={!activeCatalogue && activeCategory === line.slug}
              >
                <Link href={`/wholesale/dashboard?category=${line.slug}`}>
                  <Layers />
                  <span>{line.label}</span>
                </Link>
              </SidebarMenuButton>

              {line.categories.length > 0 && (
                <SidebarMenuSub>
                  {line.categories.map((category) => (
                    <SidebarMenuSubItem key={category.slug}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={
                          !activeCatalogue && activeCategory === category.slug
                        }
                      >
                        <Link
                          href={`/wholesale/dashboard?category=${category.slug}`}
                        >
                          <span>{category.label}</span>
                        </Link>
                      </SidebarMenuSubButton>

                      {category.catalogues.map((entry) => (
                        <SidebarMenuSubButton
                          key={entry.slug}
                          asChild
                          size="sm"
                          className="ml-3"
                          isActive={activeCatalogue === entry.slug}
                        >
                          <Link
                            href={`/wholesale/dashboard?category=${category.slug}&catalogue=${entry.slug}`}
                          >
                            <span>{entry.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      ))}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function SellerSidebar({
  shopName,
  sellerLines,
}: {
  shopName: string
  /** The lines this shop was approved for — the whole of what it may see. */
  sellerLines: CategorySlug[]
}) {
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

        <CatalogueNav sellerLines={sellerLines} />
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
