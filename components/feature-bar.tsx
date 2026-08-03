'use client'

import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

/** In the order of `t.features`. Trimmed to their artwork so the four sit at
 *  the same optical size — see `public/icons`. */
const ICONS = [
  '/icons/feature-delivery.png',
  '/icons/feature-returns.png',
  '/icons/feature-payment.png',
  '/icons/feature-original.png',
]

/**
 * The four service promises, as one row split by hairline rules. Used on the
 * homepage and at the foot of the shop and category pages.
 */
export function FeatureBar() {
  const { t } = useLanguage()

  return (
    <section className="py-6 lg:py-8">
      <Container>
        {/* Two up on phones so the promises never become four stacked rows. */}
        <ul className="grid grid-cols-2 rounded-2xl border border-border bg-card lg:grid-cols-4">
          {t.features.map((feature, index) => {
            const icon = ICONS[index]

            return (
              <Reveal
                as="li"
                key={feature.title}
                delay={index * 80}
                className={[
                  // A short centred rule rather than a full-height border: it
                  // reads as a separator instead of a table cell wall.
                  "relative before:absolute before:top-1/2 before:left-0 before:hidden before:h-11 before:w-px before:-translate-y-1/2 before:bg-border before:content-['']",
                  // Never before the first item of a row: even ones at two
                  // columns, everything past the first at four.
                  '[&:nth-child(even)]:before:block lg:[&:nth-child(n+2)]:before:block',
                  // The second phone row needs its own rule above it.
                  '[&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-border lg:[&:nth-child(n+3)]:border-t-0',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
                  {/* Bare outline icons — no tinted disc behind them. */}
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={256}
                    height={256}
                    sizes="36px"
                    className="size-8 shrink-0 object-contain sm:size-9"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[13px] leading-tight font-bold text-foreground sm:text-[15px]">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
