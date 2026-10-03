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
        {/* One compact row on phones too — the promises read as a strip, not a block. */}
        <ul className="grid grid-cols-4 rounded-2xl border border-border bg-card">
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
                  "relative before:absolute before:top-1/2 before:left-0 before:hidden before:h-8 before:w-px before:-translate-y-1/2 before:bg-border before:content-['']",
                  // Never before the first item.
                  'lg:before:h-11 [&:nth-child(n+2)]:before:block',
                ].join(' ')}
              >
                <div className="flex items-center justify-center gap-1.5 px-1 py-3 md:justify-start md:gap-2.5 md:px-3 md:py-4 lg:gap-4 lg:px-6 lg:py-6">
                  {/* Bare outline icons — no tinted disc behind them. */}
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden="true"
                    width={256}
                    height={256}
                    sizes="36px"
                    className="size-5 shrink-0 object-contain md:size-7 lg:size-9"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[10px] leading-tight font-bold text-foreground md:text-[12px] lg:text-[15px]">
                      {feature.title}
                    </h3>
                    <p className="mt-0.5 hidden text-muted-foreground md:block md:text-[11px] md:leading-tight lg:mt-1 lg:text-sm">
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
