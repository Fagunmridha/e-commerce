'use client'

import {
  Facebook,
  Headphones,
  Instagram,
  RotateCcw,
  ShieldCheck,
  Truck,
  Twitter,
} from 'lucide-react'
import { Container } from '@/components/layout/container'
import { LanguageSelect } from '@/components/language-select'
import { useLanguage } from '@/components/language-provider'

const SOCIALS = [
  { Icon: Facebook, name: 'Facebook' },
  { Icon: Instagram, name: 'Instagram' },
  { Icon: Twitter, name: 'Twitter' },
]

/**
 * The thin strip above the navbar: the shipping promise, the three service
 * promises, the language picker and social links. On phones it collapses to
 * just the shipping promise so it never eats two lines.
 */
export function AnnouncementBar() {
  const { t } = useLanguage()
  const [, returns, payment, support] = t.features

  return (
    <div className="border-b border-white/10 bg-foreground text-background">
      <Container>
        <div className="flex h-10 items-center justify-between gap-6 text-xs">
          <p className="flex items-center gap-2 font-medium whitespace-nowrap">
            <Truck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {t.header.announceShipping}
          </p>

          <ul className="hidden items-center gap-6 text-background/70 lg:flex">
            <li className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {returns.title}
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {payment.title}
            </li>
            <li className="flex items-center gap-1.5">
              <Headphones className="size-3.5" aria-hidden="true" />
              {support.title}
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LanguageSelect tone="inverted" />
            </div>
            <ul className="hidden items-center gap-1 sm:flex" aria-label={t.header.followUs}>
              {SOCIALS.map(({ Icon, name }) => (
                <li key={name}>
                  <a
                    href="#"
                    aria-label={name}
                    className="grid size-7 place-items-center rounded-full text-background/70 transition-colors hover:bg-white/10 hover:text-background focus-visible:ring-[3px] focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    <Icon className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </div>
  )
}
