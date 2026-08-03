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
}: {
  href?: string | null
  withTile?: boolean
  tone?: 'default' | 'inverted'
  className?: string
}) {
  const inner = (
    <>
      {withTile && <BagMark />}
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
