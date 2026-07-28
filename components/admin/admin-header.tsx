'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { UserButton } from '@clerk/nextjs'
import {
  Bell,
  Check,
  Globe,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react'
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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
import { Kbd } from '@/components/ui/kbd'
import { useLanguage } from '@/components/language-provider'
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n'
import { ADMIN_NAV, adminBreadcrumb } from '@/lib/admin/nav'

/** Every linkable admin destination, flattened for the command palette. */
const SEARCHABLE = ADMIN_NAV.flatMap((group) =>
  group.items
    .filter((item) => !item.planned)
    .map((item) => ({ ...item, group: group.label })),
)

const QUICK_CREATE = [
  { href: '/admin/products/new', label: 'New product' },
  { href: '/admin/banners/new', label: 'New banner' },
  { href: '/admin/orders', label: 'View orders' },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // `resolvedTheme` is undefined until mounted; rendering the icon before then
  // would mismatch the server HTML.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {mounted && dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  )
}

function LanguageMenu() {
  const { locale, setLocale } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
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

export function AdminHeader({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const crumbs = adminBreadcrumb(pathname)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => (
            <span key={crumb} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === crumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink>{crumb}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          className="hidden h-9 w-56 justify-start gap-2 px-3 text-muted-foreground md:flex"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left text-sm">Search…</span>
          <Kbd>⌘K</Kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              {pendingOrders > 0 && (
                <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                  {pendingOrders > 99 ? '99+' : pendingOrders}
                </span>
              )}
              <span className="sr-only">
                {pendingOrders} orders awaiting action
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pendingOrders > 0 ? (
              <DropdownMenuItem asChild>
                <Link href="/admin/orders?status=pending">
                  {pendingOrders} order{pendingOrders === 1 ? '' : 's'} awaiting
                  processing
                </Link>
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nothing needs your attention
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <LanguageMenu />

        <Button variant="ghost" size="icon" asChild aria-label="Settings">
          <Link href="/admin">
            <Settings className="size-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="ml-1 gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {QUICK_CREATE.map((action) => (
              <DropdownMenuItem key={action.href} asChild>
                <Link href={action.href}>{action.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-1 flex items-center">
          <UserButton />
        </div>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Jump to a section…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          {ADMIN_NAV.map((group) => {
            const items = SEARCHABLE.filter((item) => item.group === group.label)
            if (items.length === 0) return null

            return (
              <CommandGroup key={group.label} heading={group.label}>
                {items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => {
                      setPaletteOpen(false)
                      router.push(item.href)
                    }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </header>
  )
}
