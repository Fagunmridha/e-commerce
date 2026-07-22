'use client'

import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const ICONS = [Truck, RotateCcw, ShieldCheck, Headphones]

export function FeatureBar() {
  const { t } = useLanguage()

  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto grid max-w-page divide-y divide-border px-4 sm:grid-cols-2 sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:divide-x lg:px-10">
        {t.features.map((feature, index) => {
          const Icon = ICONS[index]

          return (
            <div
              key={feature.title}
              className="group flex items-center gap-4 px-2 py-6 lg:px-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                  {feature.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
