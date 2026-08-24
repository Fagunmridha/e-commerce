'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, Leaf, Package, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const VALUE_ICONS = [Package, Leaf, Heart, Users]

/** Matches the PageHeader's gutter, so every band lines up down the page. */
const SECTION = 'mx-auto max-w-page px-4 sm:px-6 lg:px-4'

export function AboutContent() {
  const { t } = useLanguage()
  const copy = t.about

  return (
    <>
      <PageHeader pageKey="about" />

      {/* Story — copy on the left, a three-tile collage on the right. The
          collage is a grid rather than absolutely-positioned overlaps: it
          reflows on a phone instead of colliding with the text above it. */}
      <section
        className={cn(
          SECTION,
          'grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20',
        )}
      >
        <Reveal>
          <p className="flex items-center gap-2.5 text-xs font-bold tracking-[0.18em] text-primary uppercase">
            <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
            {copy.storyEyebrow}
          </p>
          <h2 className="mt-4 text-display-sm text-balance text-foreground">
            {copy.storyTitle}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="group">
              <Link href="/shop">
                {copy.storyCta}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">{copy.storySecondaryCta}</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={120} className="relative">
          {/* Decorative wash behind the collage's top corner. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-6 -z-10 size-48 rounded-full bg-primary/15 blur-3xl"
          />

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="relative col-span-2 aspect-16/10 overflow-hidden rounded-2xl bg-muted shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=750&fit=crop"
                alt={copy.storyImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>

            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=600&fit=crop"
                alt={copy.storyImageAltDetail}
                fill
                sizes="(max-width: 1024px) 50vw, 22vw"
                className="object-cover"
              />
            </div>

            {/* The third tile is a figure, not a photo — it gives the collage
                its focal point and repeats the dark panel used elsewhere. */}
            <div className="flex aspect-square flex-col justify-between rounded-2xl bg-foreground p-5 text-background">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-primary">
                <Sparkles className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {copy.storyBadgeValue}
                </p>
                <p className="mt-1 text-xs leading-snug text-background/65 sm:text-sm">
                  {copy.storyBadgeLabel}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Numbers, moved up under the story: they are the proof the story just
          claimed, and they used to sit alone at the bottom of the page. */}
      <section className={cn(SECTION, 'pb-14 lg:pb-20')}>
        <Reveal>
          <dl className="grid grid-cols-2 gap-y-8 rounded-2xl border border-border bg-card px-4 py-8 shadow-card sm:px-8 lg:grid-cols-4 lg:py-10">
            {copy.stats.map((stat) => (
              <div
                key={stat.label}
                className="border-border px-2 text-center [&:nth-child(even)]:border-l lg:[&:nth-child(n+2)]:border-l"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <p className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-muted/40">
        <div className={cn(SECTION, 'py-14 lg:py-20')}>
          <SectionHeading
            eyebrow={copy.valuesEyebrow}
            title={copy.valuesTitle}
            subtitle={copy.valuesSubtitle}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.values.map((value, index) => {
              const Icon = VALUE_ICONS[index]

              return (
                <Reveal key={value.title} delay={index * 90} className="h-full">
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover">
                    {/* A watermarked index — visible enough to order the
                        cards, faint enough not to compete with the copy. */}
                    <span
                      aria-hidden="true"
                      className="absolute top-4 right-5 text-4xl font-extrabold tabular-nums text-foreground/6"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary transition-colors duration-300 group-hover:bg-button group-hover:text-button-foreground">
                      <Icon className="size-5.5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-foreground">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Milestones — a vertical thread on phones, a horizontal one across
          four columns from `lg`. */}
      <section className={cn(SECTION, 'py-14 lg:py-20')}>
        <SectionHeading
          eyebrow={copy.timelineEyebrow}
          title={copy.timelineTitle}
        />

        <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-8">
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-[7px] w-px bg-border lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-full"
          />
          {copy.timeline.map((item, index) => (
            <Reveal
              key={item.year}
              as="li"
              delay={index * 100}
              className="relative pl-8 lg:pt-10 lg:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-1 left-0 size-3.5 rounded-full bg-button ring-4 ring-background lg:top-0"
              />
              <p className="text-sm font-bold tracking-wide text-primary">
                {item.year}
              </p>
              <h3 className="mt-1.5 text-base font-bold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Closing panel — the page used to end on a bare row of numbers with
          nowhere to go next. */}
      <section className={cn(SECTION, 'pb-16 lg:pb-24')}>
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-12 text-center text-background sm:px-12 lg:py-16">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full bg-primary/25 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -bottom-20 size-64 rounded-full bg-primary/15 blur-3xl"
            />

            <div className="relative">
              <h2 className="text-display-sm text-balance text-background">
                {copy.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-background/65 sm:text-base">
                {copy.ctaBody}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex h-12 items-center gap-2 rounded-lg bg-button px-8 text-sm font-semibold text-button-foreground shadow-lg shadow-button/25 transition-all hover:-translate-y-0.5 hover:bg-button/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {copy.ctaPrimary}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-lg border border-white/25 px-8 text-sm font-semibold text-background transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {copy.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
