'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import type { Dictionary } from '@/lib/dictionaries'

type LinkKey = keyof Dictionary['footer']['links']

const FOOTER_COLUMNS: {
  column: keyof Dictionary['footer']['columns']
  links: { key: LinkKey; href: string }[]
}[] = [
  {
    column: 'shop',
    links: [
      { key: 'menswear', href: '/men' },
      { key: 'womenswear', href: '/women' },
      { key: 'kidswear', href: '/kids' },
      { key: 'accessories', href: '/accessories' },
    ],
  },
  {
    column: 'support',
    links: [
      { key: 'contactUs', href: '/contact' },
      { key: 'shippingInfo', href: '/contact' },
      { key: 'returns', href: '/contact' },
      { key: 'faqs', href: '/contact' },
    ],
  },
  {
    column: 'company',
    links: [
      { key: 'aboutUs', href: '/about' },
      { key: 'ourStory', href: '/about' },
      { key: 'careers', href: '/about' },
      { key: 'blog', href: '/about' },
    ],
  },
]

const SOCIAL_LINKS = ['Instagram', 'Facebook', 'Twitter', 'TikTok']

export function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-border bg-muted/40" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold tracking-tight">
              <span className="text-primary">CP</span>{' '}
              <span className="text-foreground">Market</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t.footer.tagline}
            </p>
          </div>

          {FOOTER_COLUMNS.map(({ column, links }) => (
            <nav key={column} aria-label={t.footer.columns[column]}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                {t.footer.columns[column]}
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-primary"
                    >
                      {t.footer.links[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label={t.footer.columns.connect}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              {t.footer.columns.connect}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {SOCIAL_LINKS.map((name) => (
                <li key={name}>
                  <Link href="#" className="transition-colors hover:text-primary">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">{t.footer.copyright}</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-primary">
              {t.footer.privacy}
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
