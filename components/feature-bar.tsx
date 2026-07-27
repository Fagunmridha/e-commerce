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
        <ul className="grid divide-y divide-border rounded-2xl border border-border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {t.features.map((feature, index) => {
            const Icon = ICONS[index]

            return (
              <Reveal
                as="li"
                key={feature.title}
                delay={index * 80}
                // Dividers between columns only, never before the first one.
                className="border-border sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(even)]:border-l lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+3)]:border-t-0"
              >
                <div className="group flex items-center gap-4 px-6 py-6">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
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
