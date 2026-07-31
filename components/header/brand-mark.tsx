import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The monogram: an outlined shopping bag with "CP" set inside it.
 *
 * The initials are SVG text rather than an HTML span layered on top, so they
 * stay centred in the bag *body* — which sits below the icon's own centre
 * because of the handle — at any rendered size, with no pixel nudging. The
 * font is inherited, so the "CP" here matches the "CP" in the wordmark.
 */
function BagMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="size-10 shrink-0 text-primary"
    >
      <path
        d="M12 9.5V7a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* A tapered body, not a rect: 18 units across the mouth widening to 24
          at the base, which is what makes it read as a bag. The corners are
          quadratics through the true corner point, so the taper stays even. */}
      <path
        d="M11.5 9.5H20.5Q25 9.5 25.62 13.96L27.38 26.54Q28 31 23.5 31H8.5Q4 31 4.62 26.54L6.38 13.96Q7 9.5 11.5 9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize="11"
        fontWeight="800"
        letterSpacing="-0.4"
      >
        CP
      </text>
    </svg>
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
