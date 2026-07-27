import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The wordmark, with an optional monogram tile. Shared by header and footer. */
export function BrandMark({
  href = '/',
  withTile = true,
  tone = 'default',
  className,
}: {
  href?: string | null
  withTile?: boolean
  tone?: 'default' | 'inverted'
  className?: string
}) {
  const inner = (
    <>
      {withTile && (
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-extrabold tracking-tight text-primary-foreground"
        >
          CP
        </span>
      )}
      <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
        <span className="text-primary">CP</span>{' '}
        <span className={tone === 'inverted' ? 'text-white' : 'text-foreground'}>
          Market
        </span>
      </span>
    </>
  )

  const classes = cn(
    'inline-flex items-center gap-2.5 rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
    className,
  )

  if (!href) return <span className={classes}>{inner}</span>

  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  )
}
