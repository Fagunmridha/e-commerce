'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, ExternalLink, Layers, Store } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
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
  /** Branches the seller folded or unfolded by hand, keyed `line:…` / `category:…`. */
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const tree = useMemo(
    () =>
      sellerLines
        // A granted line an admin has since switched off, or closed to trade,
        // is not in the active list — and a heading with nothing under it,
        // labelled with a raw slug, is worse than no heading.
        .filter((slug) =>
          wholesaleCategories.some((category) => category.slug === slug),
        )
        .map((slug) => {
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

  // Every level is a dropdown. A branch is open when it holds the row being
  // filtered on, so the tree always shows where the seller is; an explicit
  // click on a chevron (or a label) wins over that until the next toggle. The
  // link and the chevron are separate targets on purpose: the label filters the
  // listing, the chevron only folds the branch.
  const isOpen = (key: string, holdsActive: boolean) =>
    overrides[key] ?? holdsActive
  const setOpen = (key: string, open: boolean) =>
    setOverrides((current) => ({ ...current, [key]: open }))
  const toggleLabel = (open: boolean, label: string) =>
    `${open ? pick({ en: 'Collapse', bn: 'বন্ধ করুন' }) : pick({ en: 'Expand', bn: 'খুলুন' })} ${label}`

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t.wholesale.nav.groupCatalogue}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {tree.map((line) => {
            const lineKey = `line:${line.slug}`
            const lineOpen = isOpen(
              lineKey,
              activeCategory === line.slug ||
                line.categories.some(
                  (category) => category.slug === activeCategory,
                ),
            )

            return (
              <Collapsible
                key={line.slug}
                asChild
                open={lineOpen}
                onOpenChange={(open) => setOpen(lineKey, open)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={line.label}
                    isActive={!activeCatalogue && activeCategory === line.slug}
                  >
                    <Link
                      href={`/wholesale/dashboard?category=${line.slug}`}
                      onClick={() => setOpen(lineKey, true)}
                    >
                      <Layers />
                      <span>{line.label}</span>
                    </Link>
                  </SidebarMenuButton>

                  {line.categories.length > 0 && (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction
                          aria-label={toggleLabel(lineOpen, line.label)}
                          className="data-[state=open]:rotate-90"
                        >
                          <ChevronRight />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {line.categories.map((category) => {
                            const categoryKey = `category:${category.slug}`
                            const categoryOpen = isOpen(
                              categoryKey,
                              activeCategory === category.slug,
                            )

                            return (
                              <Collapsible
                                key={category.slug}
                                asChild
                                open={categoryOpen}
                                onOpenChange={(open) =>
                                  setOpen(categoryKey, open)
                                }
                              >
                                <SidebarMenuSubItem>
                                  <div className="flex items-center gap-0.5">
                                    <SidebarMenuSubButton
                                      asChild
                                      className="flex-1"
                                      isActive={
                                        !activeCatalogue &&
                                        activeCategory === category.slug
                                      }
                                    >
                                      <Link
                                        href={`/wholesale/dashboard?category=${category.slug}`}
                                        onClick={() =>
                                          setOpen(categoryKey, true)
                                        }
                                      >
                                        <span>{category.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>

                                    {category.catalogues.length > 0 && (
                                      <CollapsibleTrigger asChild>
                                        <button
                                          type="button"
                                          aria-label={toggleLabel(
                                            categoryOpen,
                                            category.label,
                                          )}
                                          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-md transition-transform data-[state=open]:rotate-90"
                                        >
                                          <ChevronRight className="size-3.5" />
                                        </button>
                                      </CollapsibleTrigger>
                                    )}
                                  </div>

                                  {category.catalogues.length > 0 && (
                                    <CollapsibleContent>
                                      <SidebarMenuSub className="mx-2">
                                        {category.catalogues.map((entry) => (
                                          <SidebarMenuSubItem key={entry.slug}>
                                            <SidebarMenuSubButton
                                              asChild
                                              size="sm"
                                              isActive={
                                                activeCatalogue === entry.slug
                                              }
                                            >
                                              <Link
                                                href={`/wholesale/dashboard?category=${category.slug}&catalogue=${entry.slug}`}
                                              >
                                                <span>{entry.label}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  )}
                                </SidebarMenuSubItem>
                              </Collapsible>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
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
