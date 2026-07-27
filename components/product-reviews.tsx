'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import { submitReview } from '@/app/actions/reviews'
import { cn } from '@/lib/utils'
import type { Localized } from '@/lib/i18n'
import type { Review } from '@/lib/types'

export function ProductReviews({
  productId,
  reviews,
}: {
  productId: string
  reviews: Review[]
}) {
  const { pick, locale } = useLanguage()
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const label = (value: Localized) => pick(value)

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (body.trim().length < 3) return
    setSubmitting(true)

    const result = await submitReview({ productId, rating, body })
    setSubmitting(false)

    if (result.ok) {
      setBody('')
      setRating(5)
      toast.success(label({ en: 'Thanks for your review!', bn: 'রিভিউয়ের জন্য ধন্যবাদ!' }))
      router.refresh()
    } else {
      toast.error(label({ en: 'Could not submit review.', bn: 'রিভিউ জমা দেওয়া যায়নি।' }))
    }
  }

  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4">
      <div className="border-t border-border pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {label({ en: 'Customer Reviews', bn: 'ক্রেতাদের রিভিউ' })}
          </h2>
          {reviews.length > 0 && (
            <Rating value={average} reviews={reviews.length} size="md" />
          )}
        </div>

        {/* Write a review */}
        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          {isSignedIn ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {label({ en: 'Your rating', bn: 'আপনার রেটিং' })}
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value}`}
                    >
                      <Star
                        className={cn(
                          'size-6 transition-colors',
                          value <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                rows={3}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={label({
                  en: 'Share what you thought about this product…',
                  bn: 'এই পণ্যটি নিয়ে আপনার মতামত লিখুন…',
                })}
              />
              <Button type="submit" disabled={submitting || body.trim().length < 3}>
                {label({ en: 'Submit review', bn: 'রিভিউ জমা দিন' })}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href="/sign-in" className="text-primary hover:underline">
                {label({ en: 'Sign in', bn: 'সাইন ইন করুন' })}
              </Link>{' '}
              {label({
                en: 'to write a review.',
                bn: 'রিভিউ লিখতে।',
              })}
            </p>
          )}
        </div>

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {label({
              en: 'No reviews yet — be the first to review this product.',
              bn: 'এখনো কোনো রিভিউ নেই — প্রথম রিভিউটি আপনিই দিন।',
            })}
          </p>
        ) : (
          <ul className="mt-6 space-y-5">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border pb-5 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {review.authorName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString(
                      locale === 'bn' ? 'bn-BD' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )}
                  </span>
                </div>
                <Rating value={review.rating} size="sm" className="mt-1" />
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
