import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one heading treatment used by every section: a small tracked eyebrow, a
 * heavy display title, an optional subtitle, and an optional link plus custom
 * actions (carousel arrows) on the right.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkHref,
  actions,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  linkLabel?: string
  linkHref?: string
  actions?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-8 flex gap-5 lg:mb-10',
        align === 'center'
          ? 'flex-col items-center text-center'
          : 'flex-wrap items-end justify-between',
        className,
      )}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-xl'}>
        {eyebrow && (
          <p className="mb-2.5 text-xs font-bold tracking-[0.18em] text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-display-sm text-balance text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {(actions || (linkLabel && linkHref)) && (
        <div className="flex items-center gap-4">
          {linkLabel && linkHref && (
            <Link
              href={linkHref}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {linkLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {actions}
        </div>
      )}
    </div>
  )
}
