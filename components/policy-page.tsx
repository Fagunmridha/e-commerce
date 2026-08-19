'use client'

import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { useLanguage } from '@/components/language-provider'
import { storeContactRows } from '@/components/store-contact'
import {
  POLICY_PATHS,
  POLICY_SLUGS,
  getPolicy,
  type PolicySlug,
} from '@/lib/policies'

/**
 * The one renderer behind /shipping-policy, /return-policy, /privacy-policy
 * and /terms. Each document is a numbered list of sections, so the page is a
 * numbered list of sections plus a table of contents that jumps into it — the
 * only navigation a long legal page actually needs.
 */
export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const { t, locale } = useLanguage()
  const doc = getPolicy(locale, slug)

  // Bangla renders its own numerals, and a page of Bangla text with Latin
  // section numbers looks like a half-finished translation.
  const num = (index: number) =>
    (index + 1).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')

  const others = POLICY_SLUGS.filter((other) => other !== slug)

  return (
    <>
      <PageHeader
        title={doc.title}
        description={doc.description}
        breadcrumb={doc.breadcrumb}
      />

      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          {/* Hidden on mobile: a fourteen-item jump list above the document is
              more scrolling than the document it is meant to save. */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24" aria-label={t.policies.onThisPage}>
              <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t.policies.onThisPage}
              </h2>
              <ol className="mt-4 space-y-0.5 border-l border-border">
                {doc.sections.map((section, index) => (
                  <li key={section.title}>
                    <a
                      href={`#section-${index + 1}`}
                      className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      <span className="tabular-nums">{num(index)}.</span>{' '}
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {doc.updated}
            </p>

            <p className="mt-5 text-base leading-relaxed text-foreground">
              {doc.intro}
            </p>

            <div className="mt-10 space-y-10">
              {doc.sections.map((section, index) => (
                <section
                  key={section.title}
                  id={`section-${index + 1}`}
                  // Clears the sticky header when a table-of-contents link lands here.
                  className="scroll-mt-24"
                >
                  <h2 className="flex items-baseline gap-3 text-lg font-bold text-foreground">
                    <span className="flex size-7 shrink-0 items-center justify-center self-start rounded-md bg-accent text-sm font-bold text-primary tabular-nums">
                      {num(index)}
                    </span>
                    {section.title}
                  </h2>

                  <div className="mt-3 space-y-3 pl-10">
                    {section.paragraphs?.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && (
                      <ul className="space-y-2">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                          >
                            <span
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.note && (
                      <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                        {section.note}
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <PolicyContact />

            <nav
              aria-label={t.policies.alsoRead}
              className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            >
              <span className="text-muted-foreground">
                {t.policies.alsoRead}:
              </span>
              {others.map((other, index) => (
                <span key={other} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-border" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <Link
                    href={POLICY_PATHS[other]}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {getPolicy(locale, other).breadcrumb}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Every one of the client’s documents ends with the same "contact us" block, so
 * it is rendered once here rather than pasted into four documents in two
 * languages — and the details themselves come from `lib/site-config.ts`, so a
 * changed number is one edit, not eight.
 */
function PolicyContact() {
  const { t } = useLanguage()

  return (
    <section className="mt-14 rounded-xl border border-border bg-muted/40 p-6 sm:p-7">
      <h2 className="text-lg font-bold text-foreground">
        {t.policies.helpTitle}
      </h2>
      <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
        {t.policies.helpText}
      </p>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        {storeContactRows(t).map(({ Icon, label, lines, href }) => (
          <div key={label} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
              </dt>
              {lines.map((line, index) => (
                <dd key={line} className="text-sm text-foreground">
                  {href && index === 0 ? (
                    <a
                      href={href}
                      className="break-words transition-colors hover:text-primary"
                    >
                      {line}
                    </a>
                  ) : (
                    line
                  )}
                </dd>
              ))}
            </div>
          </div>
        ))}
      </dl>

      <Button asChild className="mt-7">
        <Link href="/contact">{t.policies.contactCta}</Link>
      </Button>
    </section>
  )
}
