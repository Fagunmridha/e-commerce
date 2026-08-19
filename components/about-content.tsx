'use client'

import Link from 'next/link'
import { ShieldCheck, ShoppingBag, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

const VALUE_ICONS = [ShieldCheck, Sparkles, Tag, ShoppingBag]

export function AboutContent() {
  const { t } = useLanguage()

  return (
    <>
      <PageHeader pageKey="about" />

      <section className="mx-auto grid max-w-page items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-4 lg:py-20">
        <Reveal>
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
        </Reveal>

        <Reveal delay={120} className="overflow-hidden rounded-xl">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=800&fit=crop"
            alt={t.about.storyImageAlt}
            loading="lazy"
            className="aspect-4/3 w-full object-cover"
          />
        </Reveal>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-4">
          <h2 className="text-display-sm text-foreground">
            {t.about.valuesTitle}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.values.map((value, index) => {
              const Icon = VALUE_ICONS[index]

              return (
                <Reveal key={value.title} delay={index * 90}>
                  <div className="h-full rounded-lg border border-border bg-card p-5">
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
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission and vision, where the invented "120K customers / 35 countries"
          counters used to sit. Numbers nobody can stand behind do not belong on
          a live storefront. */}
      <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-4 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-display-sm text-foreground">
              {t.about.missionTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.about.mission}
            </p>
          </Reveal>

          <Reveal
            delay={120}
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <h2 className="text-display-sm text-foreground">
              {t.about.visionTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.about.vision}
            </p>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <p className="mt-12 text-center text-xl font-bold text-foreground sm:text-2xl">
            {t.about.closing}
          </p>
        </Reveal>
      </section>
    </>
  )
}
