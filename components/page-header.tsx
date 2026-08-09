'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/dictionaries'

type PageHeaderProps = (
  /** Pull title, description and breadcrumb straight from the dictionary. */
  | { pageKey: keyof Dictionary['pages'] }
  /** Or pass already-translated strings (category pages build theirs from data). */
  | { title: string; description?: string; breadcrumb?: string }
) & {
  /**
   * A shorter band with a smaller title. For pages where the header is only
   * orientation and the work is below it — checkout being the case that asked
   * for it: a display-size "Checkout" over a form the shopper is trying to
   * finish spends the top of the screen on a word they already know.
   */
  compact?: boolean
}

export function PageHeader(props: PageHeaderProps) {
  const { t } = useLanguage()
  const compact = props.compact ?? false

  const { title, description, breadcrumb } =
    'pageKey' in props ? t.pages[props.pageKey] : props

  return (
    <div className="border-b border-border bg-muted/60">
      <div
        className={cn(
          'mx-auto max-w-page px-4 sm:px-6 lg:px-4',
          compact ? 'py-5 sm:py-7' : 'py-10 sm:py-12',
        )}
      >
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className={cn(
              'flex items-center gap-1 text-xs text-muted-foreground',
              compact ? 'mb-2' : 'mb-3',
            )}
          >
            <Link href="/" className="transition-colors hover:text-primary">
              {t.common.home}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{breadcrumb}</span>
          </nav>
        )}
        <h1
          className={cn(
            'text-foreground',
            compact
              ? 'text-2xl font-bold tracking-tight sm:text-3xl'
              : 'text-display-sm sm:text-display',
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              'max-w-2xl text-sm text-muted-foreground',
              compact ? 'mt-1.5' : 'mt-2',
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
