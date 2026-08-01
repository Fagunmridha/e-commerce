'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import {
  NAV_LINK_ACTIVE,
  NAV_LINK_CLASS,
} from '@/components/header/nav-link-class'
import { cn } from '@/lib/utils'

/**
 * The Shop dropdown. Categories come from the database via the catalogue
 * context, so the panel always matches the real store. Radix supplies the
 * keyboard and focus behaviour.
 */
export function MegaMenu({ active }: { active: boolean }) {
  const { t, pick } = useLanguage()
  const { categories, products } = useCatalogue()

  const collections = [
    { label: t.header.mega.newArrivals, href: '/shop?sort=new' },
    { label: t.header.mega.bestSellers, href: '/shop?sort=rating' },
    { label: t.header.mega.onSale, href: '/shop?sale=1' },
    { label: t.sections.viewAll, href: '/shop' },
  ]

  // Any discounted product makes a good panel hero; fall back to the first one.
  const feature = products.find((product) => product.oldPrice) ?? products[0]

  return (
    <NavigationMenu viewport={false} className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              NAV_LINK_CLASS,
              'h-auto gap-1 bg-transparent focus:bg-accent data-[state=open]:bg-accent data-[state=open]:text-primary',
              // The chevron sits inside the button, so the underline stops
              // short of it and tracks the label alone.
              'after:right-7',
              active && NAV_LINK_ACTIVE,
            )}
          >
            {t.nav.shop}
          </NavigationMenuTrigger>

          <NavigationMenuContent className="rounded-2xl border border-border p-0 shadow-card-hover">
            <div className="grid w-[46rem] grid-cols-[1fr_1fr_18rem] gap-8 p-7">
              <div>
                <p className="mb-4 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {t.header.mega.shopByCategory}
                </p>
                <ul className="space-y-1">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={category.href}
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
                        >
                          {pick(category.name)}
                          <span className="text-xs text-muted-foreground">
                            {category.itemCount}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-4 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {t.header.mega.collections}
                </p>
                <ul className="space-y-1">
                  {collections.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </div>

              {feature && (
                <NavigationMenuLink asChild>
                  <Link
                    href={`/product/${feature.id}`}
                    className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-secondary p-5 focus:bg-secondary"
                  >
                    <Image
                      src={feature.image || '/placeholder.svg'}
                      alt=""
                      fill
                      sizes="288px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
                    <span className="relative">
                      <span className="block text-base font-bold text-white">
                        {t.header.mega.featuredTitle}
                      </span>
                      <span className="mt-1 block text-xs text-white/75">
                        {t.header.mega.featuredBody}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-white uppercase">
                        {t.header.mega.featuredCta}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                </NavigationMenuLink>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
