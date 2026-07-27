'use client'

import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ContactForm } from '@/components/contact-form'
import { useLanguage } from '@/components/language-provider'

const DETAIL_ICONS = [Mail, Phone, MapPin, Clock]

export function ContactContent() {
  const { t } = useLanguage()

  return (
    <>
      <PageHeader pageKey="contact" />

      <section className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-4">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">
            {t.contact.formTitle}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            {t.contact.formSubtitle}
          </p>
          <ContactForm />
        </div>

        <div className="space-y-4">
          {t.contact.details.map((detail, index) => {
            const Icon = DETAIL_ICONS[index]

            return (
              <div
                key={detail.title}
                className="flex gap-3 rounded-lg border border-border bg-card p-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {detail.title}
                  </h3>
                  {detail.lines.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
