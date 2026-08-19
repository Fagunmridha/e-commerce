'use client'

import { PageHeader } from '@/components/page-header'
import { ContactForm } from '@/components/contact-form'
import { storeContactRows } from '@/components/store-contact'
import { useLanguage } from '@/components/language-provider'

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
          {storeContactRows(t).map(({ Icon, label, lines, href }) => (
            <div
              key={label}
              className="flex gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  {label}
                </h3>
                {lines.map((line, index) => (
                  <p
                    key={line}
                    className="text-sm break-words text-muted-foreground"
                  >
                    {href && index === 0 ? (
                      <a
                        href={href}
                        className="transition-colors hover:text-primary"
                      >
                        {line}
                      </a>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
