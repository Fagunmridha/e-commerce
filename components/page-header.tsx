'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import type { Dictionary } from '@/lib/dictionaries'

type PageHeaderProps =
  /** Pull title, description and breadcrumb straight from the dictionary. */
  | { pageKey: keyof Dictionary['pages'] }
  /** Or pass already-translated strings (category pages build theirs from data). */
  | { title: string; description?: string; breadcrumb?: string }

export function PageHeader(props: PageHeaderProps) {
  const { t } = useLanguage()

  const { title, description, breadcrumb } =
    'pageKey' in props ? t.pages[props.pageKey] : props

  return (
    <div className="border-b border-border bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              {t.common.home}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{breadcrumb}</span>
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
