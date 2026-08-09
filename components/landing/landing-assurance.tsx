'use client'

import { BadgeCheck, PhoneCall, Truck, Wallet } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

/** In the order of `t.landing.trust`. */
const TRUST_ICONS = [Wallet, Truck, BadgeCheck, PhoneCall]

/**
 * The four promises under the buy box. Ad traffic arrives cold — it has never
 * seen this store before — so the objections (do I pay first? does it reach my
 * district? is it real? will anyone answer?) get answered on the page rather
 * than left for a WhatsApp message that may never be sent.
 */
export function LandingTrust() {
  const { t } = useLanguage()

  return (
    <section className="border-t border-border bg-secondary/40 py-12 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-4">
        <h2 className="text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.landing.trustTitle}
        </h2>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {t.landing.trust.map((item, index) => {
            const Icon = TRUST_ICONS[index] ?? BadgeCheck

            return (
              <li
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/**
 * "Ordering takes a minute" — three numbered steps.
 *
 * The single biggest reason a cash-on-delivery funnel loses a visitor is not
 * knowing what happens after the button: the steps say it in one line each.
 */
export function LandingSteps() {
  const { t } = useLanguage()

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-4">
        <h2 className="text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.landing.stepsTitle}
        </h2>

        <ol className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {t.landing.steps.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-border bg-card p-5 text-center"
            >
              <span className="mx-auto grid size-9 place-items-center rounded-full bg-button text-sm font-bold text-button-foreground">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
