'use client'

import { Quote } from 'lucide-react'
import { Rating } from '@/components/rating'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { useLanguage } from '@/components/language-provider'

const AVATAR_TINTS = [
  'bg-[#e0e7ff] text-[#3730a3]',
  'bg-[#fce7f3] text-[#9d174d]',
  'bg-[#fef3c7] text-[#92400e]',
]

export function Testimonials() {
  const { t } = useLanguage()

  return (
    <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.home.reviewsEyebrow}
          title={t.home.reviewsTitle}
          align="center"
        />
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        {t.home.testimonials.map((review, index) => (
          <Reveal key={review.name} delay={index * 120}>
            <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
              <Quote className="size-7 text-primary/25" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                {review.text}
              </blockquote>
              <Rating value={5} size="sm" className="mt-5" />
              <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <span
                  className={`grid size-10 place-items-center rounded-full text-sm font-bold ${AVATAR_TINTS[index % AVATAR_TINTS.length]}`}
                  aria-hidden="true"
                >
                  {review.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {review.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {review.location}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
