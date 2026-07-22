import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one heading treatment used by every section: a small tracked eyebrow, a
 * heavy display title, and an optional link on the right.
 */
export function SectionHeading({
  eyebrow,
  title,
  linkLabel,
  linkHref,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  linkLabel?: string
  linkHref?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-8 flex gap-4',
        align === 'center'
          ? 'flex-col items-center text-center'
          : 'flex-wrap items-end justify-between',
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-display-sm text-foreground">{title}</h2>
      </div>

      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="group inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
