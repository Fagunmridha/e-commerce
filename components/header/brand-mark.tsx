import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The monogram: the CP shopping-bag logo. `object-contain` keeps its own
 * proportions inside the square slot rather than stretching it to fit.
 */
function BagMark() {
  return (
    <Image
      src="/icons/brand-mark.png"
      alt=""
      aria-hidden="true"
      width={242}
      height={256}
      sizes="40px"
      priority
      className="size-10 shrink-0 object-contain"
    />
  )
}

/** The wordmark, with an optional monogram tile. Shared by header and footer. */
export function BrandMark({
  href = '/',
  withTile = true,
  tone = 'default',
  className,
  compact = false,
}: {
  href?: string | null
  withTile?: boolean
  tone?: 'default' | 'inverted'
  className?: string
  /** Drops "Market" below `sm`, keeping just "CP" + the bag tile. For the
   * one spot — the sticky mobile header — that shares its row with the
   * hamburger button on one side and four icon buttons on the other, where
   * the full wordmark left the row too wide to fit a phone screen. Every
   * other place this renders (the nav drawer, the footer) has room to spare
   * for the full name, so they don't pass this. */
  compact?: boolean
}) {
  const inner = (
    <>
      {withTile && <BagMark />}
      <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
        <span className="text-primary">CP</span>
        <span
          className={cn(
            tone === 'inverted' ? 'text-white' : 'text-foreground',
            compact && 'hidden sm:inline',
          )}
        >
          {' '}Market
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
