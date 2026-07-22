'use client'

import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const ICONS = [Truck, RotateCcw, ShieldCheck, Headphones]

export function FeatureBar() {
  const { t } = useLanguage()

  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {t.features.map((feature, index) => {
          const Icon = ICONS[index]

          return (
            <div key={feature.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground">
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
