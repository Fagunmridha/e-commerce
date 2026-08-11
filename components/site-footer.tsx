'use client'

import Link from 'next/link'
import { Banknote, Facebook, Instagram, MapPin, Phone, Twitter } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { BrandMark } from '@/components/header/brand-mark'
import { useLanguage } from '@/components/language-provider'
import type { Dictionary } from '@/lib/dictionaries'

type NavKey = keyof Dictionary['nav']
type LinkKey = keyof Dictionary['footer']['links']

/** Quick Links renders as two side-by-side lists, as in the reference. */
const QUICK_LINKS: { nav?: NavKey; link?: LinkKey; href: string }[][] = [
  [
    { nav: 'home', href: '/' },
    { nav: 'shop', href: '/shop' },
    { nav: 'men', href: '/men' },
    { nav: 'women', href: '/women' },
  ],
  [
    { nav: 'kids', href: '/kids' },
    { link: 'aboutUs', href: '/about' },
    { link: 'contactUs', href: '/contact' },
  ],
]

const SERVICE_LINKS: { key: LinkKey; href: string }[] = [
  { key: 'wholesale', href: '/wholesale' },
  { key: 'shippingPolicy', href: '/contact' },
  { key: 'returnPolicy', href: '/contact' },
  { key: 'privacyPolicy', href: '/contact' },
  { key: 'termsConditions', href: '/contact' },
]

const SOCIALS = [
  { Icon: Facebook, name: 'Facebook' },
  { Icon: Instagram, name: 'Instagram' },
  { Icon: Twitter, name: 'Twitter' },
]

export function SiteFooter() {
  const { t } = useLanguage()

  const linkClass =
    'text-sm text-background/60 transition-colors hover:text-background focus-visible:ring-[3px] focus-visible:ring-white/40 focus-visible:outline-none'

  return (
    <footer className="mt-3 bg-foreground text-background lg:mt-4" role="contentinfo">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:py-14">
          <div>
            <BrandMark href="/" withTile={false} tone="inverted" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-background/60">
              {t.footer.tagline}
            </p>

            <ul className="mt-5 flex items-center gap-4" aria-label={t.header.followUs}>
              {SOCIALS.map(({ Icon, name }) => (
                <li key={name}>
                  <a
                    href="#"
                    aria-label={name}
                    className="block text-background/70 transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t.footer.columns.quickLinks}>
            <h2 className="text-sm font-bold text-background">
              {t.footer.columns.quickLinks}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-6">
              {QUICK_LINKS.map((column, index) => (
                <ul key={index} className="space-y-3">
                  {column.map((item) => (
                    <li key={item.href + (item.nav ?? item.link)}>
                      <Link href={item.href} className={linkClass}>
                        {item.nav
                          ? t.nav[item.nav]
                          : t.footer.links[item.link!]}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </nav>

          <nav aria-label={t.footer.columns.customerService}>
            <h2 className="text-sm font-bold text-background">
              {t.footer.columns.customerService}
            </h2>
            <ul className="mt-5 space-y-3">
              {SERVICE_LINKS.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={linkClass}>
                    {t.footer.links[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-background">
              {t.footer.columns.contact}
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-background/60">
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a
                  href={`tel:${t.footer.contact.phone.replace(/[^\d+]/g, '')}`}
                  className="transition-colors hover:text-background"
                >
                  {t.footer.contact.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t.footer.contact.address}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-background">
              {t.footer.columns.payment}
            </h2>
            {/* One method, because one method is what the checkout offers.
                The card brands that used to sit here advertised gateways the
                store has never had — a promise the order form would break. */}
            <div className="mt-5 flex max-w-[14rem] items-center gap-3 rounded-md bg-white px-3.5 py-3 text-foreground">
              <Banknote className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold tracking-tight">
                  {t.checkout.methods.cod}
                </span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  {t.checkout.methods.codHint}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <p className="text-sm text-background/50">{t.footer.copyright}</p>
        </div>
      </Container>
    </footer>
  )
}
