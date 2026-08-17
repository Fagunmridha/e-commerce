'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Check, Globe, Plus } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/components/language-provider'
import { useBreadcrumbLabel } from '@/components/breadcrumb-label'
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n'
import { sellerCrumb } from '@/lib/wholesale/nav'

function LanguageMenu({ label }: { label: string }) {
  const { locale, setLocale } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <Globe className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((code) => (
          <DropdownMenuItem key={code} onSelect={() => setLocale(code)}>
            <span className="flex-1">{LOCALE_LABELS[code]}</span>
            {locale === code && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SellerHeader() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const nav = t.wholesale.nav
  // The listing's own name when a product page is open, so the trail reads
  // "Listings › Cotton Panjabi" rather than a generic "Edit listing".
  const entityLabel = useBreadcrumbLabel(pathname)
  const crumb = sellerCrumb(pathname, t, entityLabel)
  const onDashboard = pathname === '/wholesale/dashboard'

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            {onDashboard ? (
              <BreadcrumbPage>{crumb}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href="/wholesale/dashboard">{nav.listings}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!onDashboard && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="inline-block max-w-56 truncate align-bottom md:max-w-96">
                  {crumb}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <LanguageMenu label={nav.language} />

        <Button asChild size="sm" className="ml-1 gap-1.5">
          <Link href="/wholesale/dashboard/products/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{nav.addProduct}</span>
          </Link>
        </Button>

        <div className="ml-1 flex items-center">
          <UserButton />
        </div>
      </div>
    </header>
  )
}
