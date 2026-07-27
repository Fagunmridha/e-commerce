'use client'

import { Gem, Headphones, RotateCcw, Truck } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

const ICONS = [Gem, Truck, RotateCcw, Headphones]

/** The dark reassurance bar: one heading and four selling points in a row. */
export function WhyChooseUs() {
  const { t } = useLanguage()
  const copy = t.home.whyChoose

  return (
    <section className="py-3 lg:py-4">
      <Container>
        <Reveal>
          <div className="rounded-2xl bg-foreground px-5 py-6 text-background sm:px-7">
            <h2 className="text-base font-bold text-background">{copy.title}</h2>

            <ul className="mt-5 grid gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {copy.items.map((item, index) => {
                const Icon = ICONS[index]

                return (
                  <li
                    key={item.label}
                    // Hairline separators between columns, never before the first.
                    className="flex items-center gap-3 border-white/12 lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+2)]:pl-6"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm leading-snug font-semibold text-background">
                      {item.label}
                      {item.note && (
                        <span className="mt-0.5 block text-xs font-normal text-background/60">
                          {item.note}
                        </span>
                      )}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
