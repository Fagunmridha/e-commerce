'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Eye,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const VALUE_ICONS = [ShieldCheck, Sparkles, Tag, ShoppingBag]

/** Matches the PageHeader's gutter, so every band lines up down the page. */
const SECTION = 'mx-auto max-w-page px-4 sm:px-6 lg:px-4'

export function AboutContent() {
  const { t } = useLanguage()
  const copy = t.about

  const purpose = [
    { icon: Target, title: copy.missionTitle, body: copy.mission },
    { icon: Eye, title: copy.visionTitle, body: copy.vision },
  ]

  return (
    <>
      <PageHeader pageKey="about" />

      {/* Story — copy on the left, a three-frame collage on the right. The
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
          {/* The brand line, sitting between the title and the story it sets
              up — heavier than body copy but not a second heading. */}
          <p className="mt-3 text-base font-semibold text-balance text-primary sm:text-lg">
            {copy.storyTagline}
          </p>
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
              <Link href="/contact">{t.pages.contact.title}</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={120} className="relative">
          {/* Decorative wash behind the collage's top corner. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-6 -z-10 size-48 rounded-full bg-primary/15 blur-3xl"
          />

          {/* One tall frame, with two smaller ones stacked beside it splitting
              the same height — a composition rather than boxes in a row. */}
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
            <div className="relative col-span-3 aspect-3/4 overflow-hidden rounded-2xl bg-muted shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&h=1200&fit=crop"
                alt={copy.storyImageAltDetail}
                fill
                sizes="(max-width: 1024px) 60vw, 28vw"
                className="object-cover"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-3 sm:gap-4">
              <div className="relative flex-1 overflow-hidden rounded-2xl bg-muted shadow-card">
                <Image
                  src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&h=700&fit=crop"
                  alt={copy.storyImageAltRail}
                  fill
                  sizes="(max-width: 1024px) 40vw, 18vw"
                  className="object-cover"
                />
              </div>

              <div className="relative flex-1 overflow-hidden rounded-2xl bg-muted shadow-card">
                <Image
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=700&fit=crop"
                  alt={copy.storyImageAlt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 18vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Why CP — the name, unpacked. Two halves side by side because that is
          what the name is: the letter is the visual anchor, so it is set large
          and decorative while the word beside it carries the meaning. */}
      <section className="border-t border-border bg-surface">
        <div className={cn(SECTION, 'py-14 lg:py-20')}>
          <SectionHeading title={copy.whyTitle} align="center" />

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {copy.why.map((item, index) => (
              <Reveal key={item.letter} delay={index * 90} className="h-full">
                <article className="flex h-full items-start gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover">
                  <span
                    aria-hidden="true"
                    className="text-5xl leading-none font-extrabold text-primary/25"
                  >
                    {item.letter}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-balance text-muted-foreground sm:text-base">
            {copy.whyClosing}
          </p>
        </div>
      </section>

      {/* What we focus on */}
      <section className="border-y border-border bg-muted/40">
        <div className={cn(SECTION, 'py-14 lg:py-20')}>
          <SectionHeading title={copy.valuesTitle} />

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

      {/* Mission, vision and the closing line in one dark panel — where the
          invented "120K customers / 35 countries" counters used to sit.
          Numbers nobody can stand behind do not belong on a live storefront,
          and the page needed somewhere to send the reader next. */}
      <section className={cn(SECTION, 'py-14 lg:py-20')}>
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-12 text-background sm:px-10 lg:px-14 lg:py-16">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full bg-primary/25 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -bottom-20 size-64 rounded-full bg-primary/15 blur-3xl"
            />

            <div className="relative">
              <div className="grid gap-8 sm:grid-cols-2 sm:gap-0">
                {purpose.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="border-white/12 sm:px-8 sm:first:pl-0 sm:last:border-l sm:last:pr-0"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-white/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-background">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-background/65">
                      {body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 border-t border-white/12 pt-10 text-center lg:mt-12 lg:pt-12">
                <p className="text-2xl font-extrabold tracking-tight text-balance text-background sm:text-display-sm">
                  {copy.closing}
                </p>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-background/65 sm:text-base">
                  {t.pages.contact.description}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/shop"
                    className="group inline-flex h-12 items-center gap-2 rounded-lg bg-button px-8 text-sm font-semibold text-button-foreground shadow-lg shadow-button/25 transition-all hover:-translate-y-0.5 hover:bg-button/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {copy.storyCta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center rounded-lg border border-white/25 px-8 text-sm font-semibold text-background transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {t.pages.contact.title}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
