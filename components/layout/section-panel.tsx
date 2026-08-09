import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

/**
 * The frame every homepage section sits in: a title on the left, a "View All"
 * link on the right, and the section's own content below. Deliberately flat —
 * no border, background or card padding — so the rows read as part of the page
 * instead of stacked boxes. Shared so categories and product rows stay
 * visually identical.
 */
export function SectionPanel({
  title,
  linkLabel,
  linkHref,
  children,
  className,
}: {
  title: string
  linkLabel?: string
  linkHref?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className="py-6 lg:py-8">
      <Container>
        <div className={cn(className)}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>

            {linkLabel && linkHref && (
              <Link
                href={linkHref}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {linkLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {children}
        </div>
      </Container>
    </section>
  )
}
