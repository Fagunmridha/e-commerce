'use client'

import Link from 'next/link'
import { Heart, Leaf, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { useLanguage } from '@/components/language-provider'

const VALUE_ICONS = [Package, Leaf, Heart, Users]

export function AboutContent() {
  const { t } = useLanguage()

  return (
    <>
      <PageHeader pageKey="about" />

      <section className="mx-auto grid max-w-page items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div>
          <h2 className="text-display-sm text-foreground">
            {t.about.storyTitle}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
            {t.about.storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Button asChild className="mt-7">
            <Link href="/shop">{t.about.storyCta}</Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=800&fit=crop"
            alt={t.about.storyImageAlt}
            loading="lazy"
            className="aspect-4/3 w-full object-cover"
          />
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10">
          <h2 className="text-display-sm text-foreground">
            {t.about.valuesTitle}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.values.map((value, index) => {
              const Icon = VALUE_ICONS[index]

              return (
                <div
                  key={value.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {t.about.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
