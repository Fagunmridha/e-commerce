'use client'

import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

const ICONS = [Truck, RotateCcw, ShieldCheck, Headphones]

/**
 * The four service promises, as one row split by hairline dividers. Used on the
 * homepage and at the foot of the shop and category pages.
 */
export function FeatureBar() {
  const { t } = useLanguage()

  return (
    <section className="py-6 lg:py-8">
      <Container>
        {/* Four across on phones as a compact icon strip, two up at sm, four
            again at lg — so the promises never turn into four stacked rows. */}
        <ul className="grid grid-cols-4 rounded-2xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-4">
          {t.features.map((feature, index) => {
            const Icon = ICONS[index]

            return (
              <Reveal
                as="li"
                key={feature.title}
                delay={index * 80}
                // Dividers between columns only, never before the first one.
                className="border-border [&:nth-child(n+2)]:border-l sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(odd)]:border-l-0 sm:[&:nth-child(even)]:border-l lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+3)]:border-t-0"
              >
                <div className="group flex flex-col items-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-4 sm:px-6 sm:py-6 sm:text-left">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground sm:size-12">
                    <Icon className="size-4 sm:size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[11px] leading-tight font-bold text-foreground sm:text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-[9px] leading-tight text-muted-foreground sm:mt-0.5 sm:text-xs">
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
