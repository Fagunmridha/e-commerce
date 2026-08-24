'use client'

import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { useLanguage } from '@/components/language-provider'
import { STORE_CONTACT, WHATSAPP_NUMBER } from '@/lib/site-config'

/**
 * The "still stuck?" band under the FAQ.
 *
 * Three channels, not the four in the mockup: there is no live-chat integration
 * in this app, and a button that opens nothing is worse than no button. Phone
 * and email come from `STORE_CONTACT` so the contact page, the policy pages and
 * this band can never disagree.
 */
export function ProductHelp() {
  const { t } = useLanguage()
  const copy = t.product

  const channels = [
    {
      Icon: Phone,
      label: copy.helpCall,
      value: STORE_CONTACT.phone,
      href: `tel:${STORE_CONTACT.phoneDial}`,
      external: false,
    },
    {
      Icon: MessageCircle,
      label: copy.helpWhatsApp,
      value: t.whatsapp.label,
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsapp.prefill)}`,
      external: true,
    },
    {
      Icon: Mail,
      label: copy.helpEmail,
      value: STORE_CONTACT.email,
      href: `mailto:${STORE_CONTACT.email}`,
      external: false,
    },
  ]

  return (
    <section className="py-3 lg:py-4">
      <Container>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-7">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {copy.helpTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.helpSubtitle}
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {channels.map((channel) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <channel.Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {channel.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {channel.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
